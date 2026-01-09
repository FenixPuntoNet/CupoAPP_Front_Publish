import { useState } from 'react'
import { useNavigate } from "@tanstack/react-router"
import Verified from '../../../assets/rdaphq_verified_icon_green.png'

export default function Modals_VerifyAccount() {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(true);

    const handleNav = (path: string) => {
        navigate({ to: path });
    };

    const handleClose = () => {
        setShowModal(false);
    }

    return (
        <div className='fixed top-0 left-0 z-40 flex items-center justify-center w-screen h-screen'>
        <div onClick={handleClose} className={`absolute justify-center items-center bg-black/80 h-screen w-screen top-0 left-0 ${showModal ? 'flex' : 'hidden'}`}></div>

        <div className='z-10 relative'>
            <div className={`flex-col relative justify-between items-center gap-12 bg-black rounded-3xl w-[80%] shadow-lg border border-white/16 p-6 ${showModal ? 'flex' : 'hidden'} max-w-lg`} style={{ margin: '0 auto' }}>
                <img src={Verified} alt="Verified" className="w-16 h-16 absolute -top-8 right-0" />

                <div className="">
                    <h3 className="text-4xl tracking-tight text-balance text-green-500 font-semibold mb-2">¡Ya puedes verificar tu cuenta!</h3>
                    <p className="tracking-tight">Sube las fotos de tu vehículo y sus documentos para poder acceder a todos los beneficios de la app y mostrar tu perfil como verificado a los demás usuarios</p>
                </div>
                <div className="buttons">
                    <a className="bg-green-500 px-5 py-2 rounded-xl text-center text-white font-semibold cursor-pointer" onClick={() => handleNav('/RegistrarVehiculo')}>Verificar</a>
                    <a className="px-5 py-2 text-center text-zinc-400 font-semibold cursor-pointer" onClick={handleClose}>Cerrar</a>
                </div>
            </div>
        </div>
        </div>
    )
}

// Component designed and developed by @rdaphq ─ https://dev.rdaphq.com
// Icons designed and provided by @rdaphq ─ https://design.rdaphq.com
