export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      booking_passengers: {
        Row: {
          booking_id: number | null
          full_name: string
          id: number
          identification_number: string
          status: string | null
          user_id: string
        }
        Insert: {
          booking_id?: number | null
          full_name: string
          id?: number
          identification_number: string
          status?: string | null
          user_id: string
        }
        Update: {
          booking_id?: number | null
          full_name?: string
          id?: number
          identification_number?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      } 
      user_cards: {
        Row: {
          id: number
          user_id: string
          card_code: string
          unicoins: number
          card_type: string | null
          card_level: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          card_code: string
          unicoins?: number
          card_type?: string | null
          card_level?: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          card_code?: string
          unicoins?: number
          card_type?: string | null
          card_level?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      user_referrals: {
        Row: {
          id: number
          referred_user_id: string
          promoter_card_code: string | null
          referred_at: string
        }
        Insert: {
          id?: number
          referred_user_id: string
          promoter_card_code?: string | null
          referred_at?: string
        }
        Update: {
          id?: number
          referred_user_id?: string
          promoter_card_code?: string | null
          referred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_referrals_promoter_card_code_fkey"
            columns: ["promoter_card_code"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["card_code"]
          }
        ]
      }
      
      bookings: {
        Row: {
          booking_date: string | null
          booking_qr: string
          booking_status: string | null
          id: number
          seats_booked: number | null
          total_price: number
          trip_id: number | null
          user_id: string | null
        }
        Insert: {
          booking_date?: string | null
          booking_qr: string
          booking_status?: string | null
          id?: number
          seats_booked?: number | null
          total_price: number
          trip_id?: number | null
          user_id?: string | null
        }
        Update: {
          booking_date?: string | null
          booking_qr?: string
          booking_status?: string | null
          id?: number
          seats_booked?: number | null
          total_price?: number
          trip_id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: number | null
          id: number
          message: string
          send_date: string | null
          user_id: string | null
        }
        Insert: {
          chat_id?: number | null
          id?: number
          message: string
          send_date?: string | null
          user_id?: string | null
        }
        Update: {
          chat_id?: number | null
          id?: number
          message?: string
          send_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }    
      goal_definitions: {
        Row: {
          id: number
          type: 'referral' | 'streak_total' | 'streak_passenger' | 'streak_driver'
          name: string
          goal: number
          reward_unicoins: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          type: 'referral' | 'streak_total' | 'streak_passenger' | 'streak_driver'
          name: string
          goal: number
          reward_unicoins: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          type?: 'referral' | 'streak_total' | 'streak_passenger' | 'streak_driver'
          name?: string
          goal?: number
          reward_unicoins?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }  

      goal_claims: {
        Row: {
          id: number
          user_id: string
          goal_id: number
          claimed_at: string
        }
        Insert: {
          id?: number
          user_id: string
          goal_id: number
          claimed_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          goal_id?: number
          claimed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users" // o "auth.users" si usas Supabase Auth
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_claims_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goal_definitions"
            referencedColumns: ["id"]
          }
        ]
      }      
      redeem_items: {
        Row: {
          id: number
          name: string
          description: string | null
          image_url: string | null
          value_unicoins: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          image_url?: string | null
          value_unicoins: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          image_url?: string | null
          value_unicoins?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }

      redeem_requests: {
        Row: {
          id: number
          user_id: string
          item_id: number
          status: 'requested' | 'delivered' | 'cancelled'
          requested_at: string
          delivered_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          item_id: number
          status?: 'requested' | 'delivered' | 'cancelled'
          requested_at?: string
          delivered_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          item_id?: number
          status?: 'requested' | 'delivered' | 'cancelled'
          requested_at?: string
          delivered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redeem_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users" // o "auth.users" si usas Supabase Auth
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redeem_requests_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "redeem_items"
            referencedColumns: ["id"]
          }
        ]
      }    
      chat_participants: {
        Row: {
          chat_id: number | null
          id: number
          joined_at: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          chat_id?: number | null
          id?: number
          joined_at?: string | null
          role: string
          user_id?: string | null
        }
        Update: {
          chat_id?: number | null
          id?: number
          joined_at?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          id: number
          trip_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          trip_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          trip_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_cards: {
        Row: {
          card_type: string
          created_at: string | null
          expiry: string
          id: number
          masked_number: string
          payment_token: string
          user_id: string | null
        }
        Insert: {
          card_type: string
          created_at?: string | null
          expiry: string
          id?: number
          masked_number: string
          payment_token: string
          user_id?: string | null
        }
        Update: {
          card_type?: string
          created_at?: string | null
          expiry?: string
          id?: number
          masked_number?: string
          payment_token?: string
          user_id?: string | null
        }
        Relationships: []
      }
      driver_giftcards: {
        Row: {
          id: number
          user_id: string
          code: string
          balance: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          code: string
          balance: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          code?: string
          balance?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_giftcards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }      
      code_giftcards: {
        Row: {
          id: number
          code: string
          value: number
          expired_at: string
          created_at: string | null
          description: string | null
        }
        Insert: {
          id?: number
          code: string
          value: number
          expired_at: string
          created_at?: string | null
          description?: string | null
        }
        Update: {
          id?: number
          code?: string
          value?: number
          expired_at?: string
          created_at?: string | null
          description?: string | null
        }
        Relationships: []
      },
      assistent: {
        Row: {
          id: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistent_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true // Cada usuario solo puede tener un asistente
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      assistent_chat: {
        Row: {
          id: number
          user_id: string
          assistent_id: number
          mensaje: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string
          assistent_id: number
          mensaje: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          assistent_id?: number
          mensaje?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistent_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistent_chat_assistent_id_fkey"
            columns: ["assistent_id"]
            isOneToOne: false
            referencedRelation: "assistent"
            referencedColumns: ["id"]
          }
        ]
      }
      terms_condictions: {
        Row: {
          id: number
          user_id: string
          created_at: string
          verification_terms: string
          suscriptions: string | null
        }
        Insert: {
          id?: number
          user_id?: string
          created_at?: string
          verification_terms?: string
          suscriptions?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          created_at?: string
          verification_terms?: string
          suscriptions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terms_condictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      califications: {
        Row: {
          id: number
          trip_id: number
          user_id: string
          driver_id: string
          value: number
          report: string | null
          created_at: string
        }
        Insert: {
          id?: number
          trip_id: number
          user_id?: string
          driver_id: string
          value: number
          report?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          trip_id?: number
          user_id?: string
          driver_id?: string
          value?: number
          report?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "califications_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "califications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "califications_driver_user_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      driver_licenses: {
        Row: {
          blood_type: string | null
          expedition_date: string | null
          expiration_date: string | null
          id: number
          identification_number: string | null
          identification_type: string | null
          license_category: string | null
          license_number: string
          photo_back_url: string | null
          photo_front_url: string | null
          user_id: string | null
          vehicle_id: number | null
        }
        Insert: {
          blood_type?: string | null
          expedition_date?: string | null
          expiration_date?: string | null
          id?: number
          identification_number?: string | null
          identification_type?: string | null
          license_category?: string | null
          license_number: string
          photo_back_url?: string | null
          photo_front_url?: string | null
          user_id?: string | null
          vehicle_id?: number | null
        }
        Update: {
          blood_type?: string | null
          expedition_date?: string | null
          expiration_date?: string | null
          id?: number
          identification_number?: string | null
          identification_type?: string | null
          license_category?: string | null
          license_number?: string
          photo_back_url?: string | null
          photo_front_url?: string | null
          user_id?: string | null
          vehicle_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_licenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          id: number
          latitude: string | null
          longitude: string | null
          main_text: string | null
          place_id: string
          postal_code: string | null
          secondary_text: string | null
          user_id: string
        }
        Insert: {
          address: string
          id?: number
          latitude?: string | null
          longitude?: string | null
          main_text?: string | null
          place_id: string
          postal_code?: string | null
          secondary_text?: string | null
          user_id: string
        }
        Update: {
          address?: string
          id?: number
          latitude?: string | null
          longitude?: string | null
          main_text?: string | null
          place_id?: string
          postal_code?: string | null
          secondary_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: number
          message: string
          send_date: string | null
          status: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          id?: number
          message: string
          send_date?: string | null
          status?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          id?: number
          message?: string
          send_date?: string | null
          status?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_gateways: {
        Row: {
          amount: number
          id: number
          payment_method: string
          provider: string
          reference: string
          status: string | null
          transaction_date: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          id?: number
          payment_method: string
          provider: string
          reference: string
          status?: string | null
          transaction_date?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          id?: number
          payment_method?: string
          provider?: string
          reference?: string
          status?: string | null
          transaction_date?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      property_cards: {
        Row: {
          cylinder_capacity: string | null
          expedition_date: string | null
          id: number
          identification_number: string | null
          identification_type: string | null
          license_number: string
          passager_capacity: number | null
          photo_back_url: string | null
          photo_front_url: string | null
          service_type: string | null
          user_id: string | null
          vehicle_id: number | null
        }
        Insert: {
          cylinder_capacity?: string | null
          expedition_date?: string | null
          id?: number
          identification_number?: string | null
          identification_type?: string | null
          license_number: string
          passager_capacity?: number | null
          photo_back_url?: string | null
          photo_front_url?: string | null
          service_type?: string | null
          user_id?: string | null
          vehicle_id?: number | null
        }
        Update: {
          cylinder_capacity?: string | null
          expedition_date?: string | null
          id?: number
          identification_number?: string | null
          identification_type?: string | null
          license_number?: string
          passager_capacity?: number | null
          photo_back_url?: string | null
          photo_front_url?: string | null
          service_type?: string | null
          user_id?: string | null
          vehicle_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_cards_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string
          id: string
        }
        Insert: {
          description: string
          id: string
        }
        Update: {
          description?: string
          id?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          bounds_ne_lat: number | null
          bounds_ne_lng: number | null
          bounds_sw_lat: number | null
          bounds_sw_lng: number | null
          distance: string | null
          duration: string | null
          end_address: string | null
          id: number
          index: number | null
          polyline: string | null
          start_address: string | null
          summary: string | null
          user_id: string
          warnings: string | null
        }
        Insert: {
          bounds_ne_lat?: number | null
          bounds_ne_lng?: number | null
          bounds_sw_lat?: number | null
          bounds_sw_lng?: number | null
          distance?: string | null
          duration?: string | null
          end_address?: string | null
          id?: number
          index?: number | null
          polyline?: string | null
          start_address?: string | null
          summary?: string | null
          user_id: string
          warnings?: string | null
        }
        Update: {
          bounds_ne_lat?: number | null
          bounds_ne_lng?: number | null
          bounds_sw_lat?: number | null
          bounds_sw_lng?: number | null
          distance?: string | null
          duration?: string | null
          end_address?: string | null
          id?: number
          index?: number | null
          polyline?: string | null
          start_address?: string | null
          summary?: string | null
          user_id?: string
          warnings?: string | null
        }
        Relationships: []
      }
      soat_details: {
        Row: {
          expedition_date: string | null
          id: number
          identification_number: string | null
          identification_type: string | null
          insurance_company: string | null
          photo_back_url: string | null
          photo_front_url: string | null
          policy_number: string
          user_id: string | null
          validity_from: string | null
          validity_to: string | null
          vehicle_id: number | null
        }
        Insert: {
          expedition_date?: string | null
          id?: number
          identification_number?: string | null
          identification_type?: string | null
          insurance_company?: string | null
          photo_back_url?: string | null
          photo_front_url?: string | null
          policy_number: string
          user_id?: string | null
          validity_from?: string | null
          validity_to?: string | null
          vehicle_id?: number | null
        }
        Update: {
          expedition_date?: string | null
          id?: number
          identification_number?: string | null
          identification_type?: string | null
          insurance_company?: string | null
          photo_back_url?: string | null
          photo_front_url?: string | null
          policy_number?: string
          user_id?: string | null
          validity_from?: string | null
          validity_to?: string | null
          vehicle_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "soat_details_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      stopovers: {
        Row: {
          estimated_time: string | null
          id: number
          location_id: number | null
          order: number | null
          trip_id: number | null
          user_id: string
        }
        Insert: {
          estimated_time?: string | null
          id?: number
          location_id?: number | null
          order?: number | null
          trip_id?: number | null
          user_id: string
        }
        Update: {
          estimated_time?: string | null
          id?: number
          location_id?: number | null
          order?: number | null
          trip_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stopovers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stopovers_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          allow_pets: string | null
          allow_smoking: string | null
          created_at: string | null
          date_time: string | null
          description: string | null
          destination_id: number | null
          id: number
          origin_id: number | null
          price_per_seat: number | null
          route_id: number | null
          seats: number | null
          seats_reserved: number | null
          status: string | null
          user_id: string | null
          vehicle_id: number | null
        }
        Insert: {
          allow_pets?: string | null
          allow_smoking?: string | null
          created_at?: string | null
          date_time?: string | null
          description?: string | null
          destination_id?: number | null
          id?: number
          origin_id?: number | null
          price_per_seat?: number | null
          route_id?: number | null
          seats?: number | null
          seats_reserved?: number | null
          status?: string | null
          user_id?: string | null
          vehicle_id?: number | null
        }
        Update: {
          allow_pets?: string | null
          allow_smoking?: string | null
          created_at?: string | null
          date_time?: string | null
          description?: string | null
          destination_id?: number | null
          id?: number
          origin_id?: number | null
          price_per_seat?: number | null
          route_id?: number | null
          seats?: number | null
          seats_reserved?: number | null
          status?: string | null
          user_id?: string | null
          vehicle_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          first_name: string
          id: number
          identification_number: string | null
          identification_type: string
          last_name: string
          phone_number: string | null
          status: string
          updated_at: string | null
          photo_user: string | null
          user_id: string
          Verification: string | null
        }
        Insert: {
          created_at?: string | null
          first_name: string
          id?: number
          identification_number: string | null
          identification_type: string
          last_name: string
          phone_number?: string | null
          status?: string
          updated_at?: string | null
          photo_user?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          first_name?: string
          id?: number
          identification_number?: string | null
          identification_type?: string
          last_name?: string
          phone_number?: string | null
          status?: string
          updated_at?: string | null
          photo_user?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          body_type: string | null
          brand: string | null
          chassis_number: string | null
          color: string | null
          created_at: string | null
          engine_number: string | null
          id: number
          model: string | null
          photo_url: string | null
          plate: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          vin_number: string | null
          year: number | null
        }
        Insert: {
          body_type?: string | null
          brand?: string | null
          chassis_number?: string | null
          color?: string | null
          created_at?: string | null
          engine_number?: string | null
          id?: number
          model?: string | null
          photo_url?: string | null
          plate: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vin_number?: string | null
          year?: number | null
        }
        Update: {
          body_type?: string | null
          brand?: string | null
          chassis_number?: string | null
          color?: string | null
          created_at?: string | null
          engine_number?: string | null
          id?: number
          model?: string | null
          photo_url?: string | null
          plate?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vin_number?: string | null
          year?: number | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          detail: string | null
          id: number
          payment_gateway_id: number | null
          status: string | null
          transaction_date: string | null
          transaction_type: string
          wallet_id: number | null
        }
        Insert: {
          amount: number
          detail?: string | null
          id?: number
          payment_gateway_id?: number | null
          status?: string | null
          transaction_date?: string | null
          transaction_type: string
          wallet_id?: number | null
        }
        Update: {
          amount?: number
          detail?: string | null
          id?: number
          payment_gateway_id?: number | null
          status?: string | null
          transaction_date?: string | null
          transaction_type?: string
          wallet_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_payment_gateway_id_fkey"
            columns: ["payment_gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          frozen_balance: number | null
          id: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          frozen_balance?: number | null
          id?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          frozen_balance?: number | null
          id?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never