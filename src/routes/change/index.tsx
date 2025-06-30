import { createFileRoute } from '@tanstack/react-router'
import React, { useEffect, useState } from "react";
import { Tables } from "../../types/Database";
import { supabase } from "../../lib/supabaseClient";
import "./index.css";

type RedeemItem = Tables<"redeem_items">;
type RedeemRequest = Tables<"redeem_requests"> & { redeem_items?: RedeemItem };

interface RedeemStoreProps {
  userId: string;
}

type CartItem = RedeemItem & { quantity: number };

const AccountView: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null);
    });
  }, []);

  if (!userId) {
    return (
      <div className="redeem-store-container dark-bg" style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="redeem-loader" />
      </div>
    );
  }

  return <RedeemStore userId={userId} />;
};

const RedeemStore: React.FC<RedeemStoreProps> = ({ userId }) => {
  const [items, setItems] = useState<RedeemItem[]>([]);
  const [requests, setRequests] = useState<RedeemRequest[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [selecting, setSelecting] = useState<RedeemItem | null>(null);
  const [selectQty, setSelectQty] = useState(1);
  const [coins, setCoins] = useState<number | null>(null);

  // Traer saldo de coins del usuario desde user_cards.unicoins
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_cards")
      .select("unicoins")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => setCoins(data?.unicoins ?? 0));
  }, [userId]);

  // Traer items activos
  useEffect(() => {
    supabase
      .from("redeem_items")
      .select("*")
      .eq("is_active", true)
      .order("value_unicoins", { ascending: true })
      .then(({ data }) => setItems(data || []));
  }, []);

  // Traer solicitudes del usuario
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("redeem_requests")
      .select("*, redeem_items(*)")
      .eq("user_id", userId)
      .order("requested_at", { ascending: false })
      .then(({ data }) => setRequests(data || []));
  }, [userId, loading]);

  // Carrito: agregar/cambiar cantidad
  function addToCart(item: RedeemItem, qty: number) {
    setCart((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (found) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
    setSelecting(null);
    setSelectQty(1);
  }

  function clearCart() {
    setCart([]);
  }

  // Carrito: total
  const cartTotal = cart.reduce((sum, i) => sum + (i.value_unicoins || 0) * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Carrito desglosado por producto
  const cartGrouped = cart.reduce<Record<string, CartItem>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  // Solicitar canje de todos los items del carrito
  async function handleRedeemCart() {
    if (cart.length === 0) return;
    if (coins !== null && cartTotal > coins) {
      setRedeemResult({ success: false, message: "No tienes suficientes UniCoins para este canje." });
      setConfirm(false);
      return;
    }
    setLoading(true);
    setConfirm(false);
    setMessage(null);
    const inserts = cart.flatMap((item) =>
      Array.from({ length: item.quantity }).map(() => ({
        user_id: userId,
        item_id: item.id,
        status: "requested" as const,
      }))
    );
    const { error } = await supabase.from("redeem_requests").insert(inserts);
    if (!error && coins !== null) {
      setCoins(coins - cartTotal);
      await supabase.from("user_cards").update({ unicoins: coins - cartTotal }).eq("user_id", userId);
    }
    setLoading(false);
    if (!error) {
      setCart([]);
      setRedeemResult({ success: true, message: "¡Solicitud enviada! Pronto nos pondremos en contacto contigo." });
    } else {
      setRedeemResult({ success: false, message: "Error al solicitar canje. Intenta de nuevo." });
    }
  }

  // Nuevo: Estado para mostrar resultado del canje en el modal
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string } | null>(null);

  // Cerrar modal de resultado
  function closeRedeemResult() {
    setRedeemResult(null);
  }

  return (
    <div className="redeem-store-container dark-bg">
      <div style={{height: '40px'}} />
      <header className="redeem-header">
        <span className="redeem-header-icon-cart" style={{ cursor: "pointer" }}>
          🛒
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </span>
        <h2 className="redeem-title">Catálogo de <span className="unicoin-highlight">UniCoins</span></h2>
        <p className="redeem-subtitle">
          Haz clic en un producto para elegir la cantidad y añadirlo a tu carrito.
        </p>
      </header>

      {/* SALDO DE COINS */}
      <div className="coins-balance-card">
        <div className="coins-balance-icon">🪙</div>
        <div className="coins-balance-info">
          <div className="coins-balance-label">Tu saldo disponible</div>
          <div className="coins-balance-value">
            {coins !== null ? coins : "..."}
            <span className="coins-balance-text">UniCoins</span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`redeem-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* PRODUCTOS */}
      <div className="redeem-items-list">
        {items.map((item) => {
          const inCart = cart.find(i => i.id === item.id);
          return (
            <div
              className={`redeem-item-card ${inCart ? "in-cart" : ""}`}
              key={item.id}
              onClick={() => setSelecting(item)}
              style={{ cursor: "pointer" }}
            >
              <div className="redeem-item-img-wrap">
                <img
                  src={item.image_url || "/giftbox.svg"}
                  alt={item.name}
                  className="redeem-item-img"
                />
                {inCart && (
                  <span className="redeem-item-badge in-cart-badge">En carrito</span>
                )}
              </div>
              <div className="redeem-item-info">
                <div className="redeem-item-name">{item.name}</div>
                <div className="redeem-item-desc">{item.description}</div>
                <div className="redeem-item-value">
                  <span className="unicoin-icon">🪙</span>
                  <span className="unicoin-amount">{item.value_unicoins}</span> UniCoins
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE PRODUCTO */}
      {selecting && (
        <div className="cart-modal-bg" onClick={() => setSelecting(null)}>
          <div className="cart-modal" onClick={e => e.stopPropagation()}>
            <h3>{selecting.name}</h3>
            <img src={selecting.image_url || "/giftbox.svg"} alt={selecting.name} className="cart-modal-img" />
            <div className="cart-modal-desc">{selecting.description}</div>
            <div className="cart-modal-value">
              <span className="unicoin-icon">🪙</span>
              <span className="unicoin-amount">{selecting.value_unicoins}</span> UniCoins
            </div>
            <div className="cart-qty-controls" style={{ margin: "1.2rem 0" }}>
              <button
                className="qty-btn"
                onClick={() => setSelectQty(q => Math.max(1, q - 1))}
              >-</button>
              <span className="qty-value">{selectQty}</span>
              <button
                className="qty-btn"
                onClick={() => setSelectQty(q => q + 1)}
              >+</button>
            </div>
            <button
              className="redeem-btn redeem-btn-cart"
              onClick={() => addToCart(selecting, selectQty)}
            >
              Añadir {selectQty > 1 ? `${selectQty} unidades` : "1 unidad"} al carrito
            </button>
            <button className="redeem-btn clear-btn" onClick={() => setSelecting(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* CARRITO DESGLOSADO */}
      <div className="redeem-cart-bar">
        <div className="redeem-cart-summary">
          <span className="cart-count">{cartCount} producto{cartCount !== 1 ? "s" : ""}</span>
          <span className="cart-total">
            <span className="unicoin-icon">🪙</span>
            <span className="unicoin-amount">{cartTotal}</span> UniCoins
          </span>
        </div>
        <div className="cart-breakdown-list">
          {Object.values(cartGrouped).map(item => (
            <div className="cart-breakdown-item" key={item.id}>
              <img src={item.image_url || "/giftbox.svg"} alt={item.name} className="cart-breakdown-img" />
              <div className="cart-breakdown-info">
                <span className="cart-breakdown-name">{item.name}</span>
                <span className="cart-breakdown-qty">x{item.quantity}</span>
                <span className="cart-breakdown-value">
                  <span className="unicoin-icon">🪙</span>
                  {item.value_unicoins * item.quantity}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button
          className="redeem-btn redeem-btn-cart"
          disabled={cart.length === 0 || loading}
          onClick={() => setConfirm(true)}
        >
          {loading ? <span className="redeem-btn-loading"></span> : <>Canjear carrito</>}
        </button>
        {cart.length > 0 && (
          <button className="redeem-btn clear-btn" onClick={clearCart} disabled={loading}>
            Limpiar carrito
          </button>
        )}
      </div>

      {/* CONFIRMAR CANJE */}
      {confirm && (
        <div className="cart-modal-bg" onClick={() => setConfirm(false)}>
          <div className="cart-modal confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>¿Confirmar canje?</h3>
            <div className="cart-breakdown-list" style={{marginBottom: 12}}>
              {Object.values(cartGrouped).map(item => (
                <div className="cart-breakdown-item" key={item.id}>
                  <img src={item.image_url || "/giftbox.svg"} alt={item.name} className="cart-breakdown-img" />
                  <div className="cart-breakdown-info">
                    <span className="cart-breakdown-name">{item.name}</span>
                    <span className="cart-breakdown-qty">x{item.quantity}</span>
                    <span className="cart-breakdown-value">
                      <span className="unicoin-icon">🪙</span>
                      {item.value_unicoins * item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p>¿Deseas canjear <b>{cartCount}</b> producto{cartCount !== 1 ? "s" : ""} por <b>{cartTotal}</b> UniCoins?</p>
            <div className="cart-modal-footer">
              <button className="redeem-btn redeem-btn-cart" onClick={handleRedeemCart} disabled={loading}>
                Sí, canjear
              </button>
              <button className="redeem-btn clear-btn" onClick={() => setConfirm(false)} disabled={loading}>
                Seguir agregando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESULTADO DE CANJE */}
      {redeemResult && (
        <div className="cart-modal-bg" onClick={closeRedeemResult}>
          <div className="cart-modal result-modal" onClick={e => e.stopPropagation()}>
            <div className={`redeem-result-icon ${redeemResult.success ? "success" : "error"}`}>
              {redeemResult.success ? "🎉" : "❌"}
            </div>
            <h3>{redeemResult.success ? "¡Canje exitoso!" : "Error en el canje"}</h3>
            <p style={{textAlign: "center", marginBottom: 16}}>{redeemResult.message}</p>
            <button className="redeem-btn redeem-btn-cart" onClick={closeRedeemResult}>
              {redeemResult.success ? "¡Listo!" : "Cerrar"}
            </button>
          </div>
        </div>
      )}

      {/* HISTORIAL */}
      <h3 className="redeem-history-title">Tus solicitudes recientes</h3>
      <div className="redeem-history-list">
        {requests.length === 0 && (
          <div className="redeem-history-empty">
            <div>No has solicitado canjes aún.</div>
          </div>
        )}
        {requests.map((req) => (
          <div className="redeem-history-item" key={req.id}>
            <div className="redeem-history-img-wrap">
              <img
                src={req.redeem_items?.image_url || "/giftbox.svg"}
                alt={req.redeem_items?.name}
                className="redeem-history-img"
              />
            </div>
            <div className="redeem-history-info">
              <div className="redeem-history-name">{req.redeem_items?.name}</div>
              <div className="redeem-history-date">
                {new Date(req.requested_at).toLocaleDateString()}{" "}
                <span className={`redeem-status ${req.status}`}>
                  {req.status === "requested" && "Solicitado"}
                  {req.status === "delivered" && (
                    <>
                      Entregado <span className="checkmark">✔️</span>
                    </>
                  )}
                  {req.status === "cancelled" && "Cancelado"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/change/")({
  component: AccountView,
});