import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useChatMessages } from './useChatMessages'

type RoleInfo = {
  name: string
  role: 'Conductor' | 'Pasajero'
  photo: string
}

export type Props = {
  chatId: number
  currentUserId: string
}

export function ChatBox({ chatId, currentUserId }: Props) {
  const messages = useChatMessages(chatId)
  const [input, setInput] = useState('')
  const [roles, setRoles] = useState<Record<string, RoleInfo>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        // Obtener participantes del chat
        const { data: participants, error: participantsError } = await supabase
          .from('chat_participants')
          .select('user_id, role')
          .eq('chat_id', chatId)

        if (participantsError) {
          console.error('❌ Error al obtener participantes:', participantsError)
          return
        }

        if (!participants || participants.length === 0) {
          console.warn('⚠️ No se encontraron participantes en el chat.')
          return
        }

        const userIds = participants
          .map((p) => p.user_id?.trim())
          .filter((id): id is string => !!id)

        if (userIds.length === 0) {
          console.warn('⚠️ No se encontraron IDs de usuarios válidos.')
          return
        }

        // Obtener perfiles de usuarios desde user_profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, first_name, photo_user')
          .in('user_id', userIds)

        if (profilesError) {
          console.error('❌ Error al obtener perfiles de usuarios:', profilesError)
          return
        }

        if (!profiles || profiles.length === 0) {
          console.warn('⚠️ No se encontraron perfiles para los usuarios.')
          return
        }

        // Crear un mapa de perfiles
        const profileMap = new Map<string, { name: string; photo: string }>()
        profiles.forEach((profile) => {
          if (profile.user_id) {
            profileMap.set(profile.user_id.trim(), {
              name: profile.first_name || 'Sin nombre',
              photo:
                profile.photo_user ||
                'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/SinFotoPerfil.png',
            })
          }
        })

        // Crear un mapa de roles
        const roleMap: Record<string, RoleInfo> = {}
        participants.forEach((participant) => {
          const userId = participant.user_id?.trim()
          if (!userId) return

          const profile = profileMap.get(userId)
          roleMap[userId] = {
            name: profile?.name ?? 'Sin nombre',
            role: participant.role === 'driver' ? 'Conductor' : 'Pasajero',
            photo:
              profile?.photo ??
              'https://mqwvbnktcokcccidfgcu.supabase.co/storage/v1/object/public/Resources/Home/SinFotoPerfil.png',
          }
        })

        setRoles(roleMap)
      } catch (error) {
        console.error('❌ Error inesperado al obtener roles:', error)
      }
    }

    fetchRoles()
  }, [chatId])

  const sendMessage = async () => {
    if (!input.trim()) return

    const { error } = await supabase.from('chat_messages').insert({
      chat_id: chatId,
      message: input,
      user_id: currentUserId,
    })

    if (!error) setInput('')
    else console.error('❌ Error al enviar mensaje:', error)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-white">
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-600 mt-12 text-sm">
            No hay mensajes aún. ¡Escribe el primero!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === currentUserId
            const userInfo = msg.user_id ? roles[msg.user_id.trim()] : undefined

            const name = userInfo?.name ?? 'Sin nombre'
            const role = userInfo?.role ?? ''
            const photo = userInfo?.photo

            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {!isOwn && (
                  <div className="flex items-start gap-2 max-w-[85%]">
                    <img
                      src={photo}
                      alt={name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-xs text-gray-400 font-semibold">
                        {name} ({role})
                      </div>
                      <div className="relative px-4 py-2 rounded-2xl text-sm shadow-sm break-words bg-[#1f1f1f] border border-gray-700 text-gray-100">
                        <p className="break-words whitespace-pre-wrap max-w-[260px]">{msg.message}</p>
                        <div className="text-[10px] text-gray-400 mt-1 text-right">
                          {new Date(msg.send_date ?? '').toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {isOwn && (
                  <div className="flex items-end justify-end max-w-[85%]">
                    <div className="relative px-4 py-2 rounded-2xl text-sm shadow-sm bg-indigo-600 text-white">
                      <p className="break-words whitespace-pre-wrap max-w-[260px]">{msg.message}</p>
                      <div className="text-[10px] text-gray-200 mt-1 text-right">
                        {new Date(msg.send_date ?? '').toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="w-full px-4 py-3 bg-[#1a1a1a] border-t border-gray-800 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-4 py-2 text-sm text-white bg-[#111] border border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition shadow-sm"
        >
          Enviar
        </button>
      </div>
    </div>
  )
}