import { useState, useEffect } from "react";

const API = "http://localhost:4000";

// ── Icons ──────────────────────────────────────────────────────────────────
const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const StarIcon = ({ filled }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "#F59E0B" : "none"} stroke="#F59E0B" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export default function App() {
  const [page, setPage]           = useState("shop");
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart]           = useState([]);
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("");
  const [stats, setStats]         = useState({});
  const [orders, setOrders]       = useState([]);
  const [toast, setToast]         = useState("");
  const [checkoutForm, setCheckoutForm] = useState({ customerName:"", email:"", address:"" });
  const [orderPlaced, setOrderPlaced]   = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetchProducts();
    fetch(`${API}/api/categories`).then(r=>r.json()).then(setCategories).catch(()=>{});
    fetch(`${API}/api/stats`).then(r=>r.json()).then(setStats).catch(()=>{});
  }, []);

  useEffect(() => { fetchProducts(); }, [search, category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `${API}/api/products?`;
      if (search)   url += `search=${search}&`;
      if (category) url += `category=${category}`;
      const res  = await fetch(url);
      const data = await res.json();
      setProducts(data);
    } catch(e) {
      setProducts([]);
    }
    setLoading(false);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? {...i, qty: i.qty+1} : i);
      return [...prev, {...product, qty: 1}];
    });
    showToast(`${product.name} added to cart!`);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart(prev => prev.map(i => i.id === id ? {...i, qty} : i));
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const placeOrder = async () => {
    if (!checkoutForm.customerName || !checkoutForm.email || !checkoutForm.address) {
      showToast("Please fill all fields"); return;
    }
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.id, quantity: i.qty })),
          ...checkoutForm,
        }),
      });
      const order = await res.json();
      setOrderPlaced(order);
      setCart([]);
      setOrders(prev => [order, ...prev]);
      showToast(`Order #${order.id} confirmed!`);
    } catch(e) { showToast("Order failed — check backend"); }
  };

  const Stars = ({ rating }) => (
    <div style={{display:"flex",gap:"2px",alignItems:"center"}}>
      {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= Math.round(rating)}/>)}
      <span style={{fontSize:"12px",color:"#6B7280",marginLeft:"4px"}}>{rating}</span>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#F8F7F4",fontFamily:"'Georgia', serif"}}>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",bottom:"24px",right:"24px",background:"#1a1a1a",color:"#fff",
          padding:"12px 20px",borderRadius:"8px",zIndex:1000,fontSize:"14px",
          boxShadow:"0 4px 20px rgba(0,0,0,0.3)",animation:"slideIn .3s ease"}}>
          {toast}
        </div>
      )}

      {/* Header */}
      <header style={{background:"#1a1a1a",color:"#fff",padding:"0 32px",height:"64px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 20px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"32px"}}>
          <h1 style={{fontSize:"22px",fontWeight:"700",letterSpacing:"2px",cursor:"pointer",
            color:"#F5E6D3"}} onClick={()=>setPage("shop")}>
            LUXE<span style={{color:"#D4AF37"}}>MART</span>
          </h1>
          <nav style={{display:"flex",gap:"4px"}}>
            {["shop","orders"].map(p=>(
              <button key={p} onClick={()=>setPage(p)} style={{
                background:page===p?"#D4AF37":"transparent",
                color:page===p?"#1a1a1a":"#ccc",
                border:"none",padding:"6px 16px",borderRadius:"4px",
                cursor:"pointer",fontSize:"13px",fontWeight:"500",textTransform:"capitalize",
                letterSpacing:"1px"}}>
                {p}
              </button>
            ))}
          </nav>
        </div>
        <button onClick={()=>setPage("cart")} style={{
          background:"transparent",border:"1.5px solid #444",color:"#fff",
          padding:"8px 16px",borderRadius:"6px",cursor:"pointer",
          display:"flex",alignItems:"center",gap:"8px",fontSize:"14px"}}>
          <CartIcon/>
          {cartCount > 0 && <span style={{background:"#D4AF37",color:"#1a1a1a",
            borderRadius:"50%",width:"20px",height:"20px",display:"flex",
            alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"700"}}>
            {cartCount}
          </span>}
          <span style={{color:"#D4AF37",fontWeight:"600"}}>${cartTotal.toFixed(2)}</span>
        </button>
      </header>

      <main style={{maxWidth:"1200px",margin:"0 auto",padding:"32px 24px"}}>

        {/* ── SHOP PAGE ── */}
        {page === "shop" && (
          <>
            {/* Hero */}
            <div style={{background:"linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)",
              borderRadius:"16px",padding:"48px",marginBottom:"32px",
              display:"flex",justifyContent:"space-between",alignItems:"center",
              color:"#fff",overflow:"hidden",position:"relative"}}>
              <div style={{position:"absolute",right:"-20px",top:"-20px",
                width:"200px",height:"200px",borderRadius:"50%",
                background:"rgba(212,175,55,0.1)"}}/> 
              <div>
                <p style={{color:"#D4AF37",fontSize:"13px",letterSpacing:"3px",marginBottom:"8px"}}>
                  PREMIUM COLLECTION
                </p>
                <h2 style={{fontSize:"36px",fontWeight:"700",lineHeight:"1.2",marginBottom:"12px"}}>
                  Discover Quality<br/>Products
                </h2>
                <p style={{color:"#999",fontSize:"14px"}}>
                  {stats.totalProducts} products · {stats.totalOrders || 0} orders placed
                </p>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:"64px"}}>🛍️</div>
                <p style={{color:"#D4AF37",fontSize:"13px",marginTop:"8px"}}>Free shipping over $50</p>
              </div>
            </div>

            {/* Search + Filter */}
            <div style={{display:"flex",gap:"12px",marginBottom:"24px",flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:"200px",position:"relative"}}>
                <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",
                  color:"#999"}}><SearchIcon/></span>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search products..."
                  style={{width:"100%",padding:"10px 12px 10px 40px",border:"1.5px solid #E5E7EB",
                    borderRadius:"8px",fontSize:"14px",background:"#fff",outline:"none",
                    boxSizing:"border-box"}}/>
              </div>
              <select value={category} onChange={e=>setCategory(e.target.value)}
                style={{padding:"10px 16px",border:"1.5px solid #E5E7EB",borderRadius:"8px",
                  fontSize:"14px",background:"#fff",cursor:"pointer",minWidth:"150px"}}>
                <option value="">All Categories</option>
                {categories.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div style={{textAlign:"center",padding:"60px",color:"#999",fontSize:"16px"}}>
                Loading products...
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"20px"}}>
                {products.map(product => (
                  <div key={product.id} style={{background:"#fff",borderRadius:"12px",
                    overflow:"hidden",boxShadow:"0 1px 8px rgba(0,0,0,0.08)",
                    transition:"transform .2s,box-shadow .2s",cursor:"pointer"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";
                      e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.12)"}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";
                      e.currentTarget.style.boxShadow="0 1px 8px rgba(0,0,0,0.08)"}}>
                    <div style={{background:"#F8F7F4",height:"160px",display:"flex",
                      alignItems:"center",justifyContent:"center",fontSize:"72px"}}>
                      {product.image}
                    </div>
                    <div style={{padding:"16px"}}>
                      <span style={{fontSize:"11px",color:"#D4AF37",fontWeight:"600",
                        letterSpacing:"1px",textTransform:"uppercase"}}>
                        {product.category}
                      </span>
                      <h3 style={{fontSize:"15px",fontWeight:"600",margin:"4px 0 6px",color:"#1a1a1a"}}>
                        {product.name}
                      </h3>
                      <Stars rating={product.rating}/>
                      <p style={{fontSize:"11px",color:"#9CA3AF",margin:"2px 0 12px"}}>
                        {product.reviews} reviews · {product.stock} in stock
                      </p>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span style={{fontSize:"20px",fontWeight:"700",color:"#1a1a1a"}}>
                          ${product.price}
                        </span>
                        <button onClick={()=>addToCart(product)} style={{
                          background:"#1a1a1a",color:"#fff",border:"none",
                          padding:"8px 16px",borderRadius:"6px",cursor:"pointer",
                          fontSize:"13px",fontWeight:"500",transition:"background .2s"}}
                          onMouseEnter={e=>e.target.style.background="#D4AF37"}
                          onMouseLeave={e=>e.target.style.background="#1a1a1a"}>
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── CART PAGE ── */}
        {page === "cart" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:"24px",alignItems:"start"}}>
            <div>
              <h2 style={{fontSize:"24px",fontWeight:"700",marginBottom:"20px",color:"#1a1a1a"}}>
                Shopping Cart ({cartCount} items)
              </h2>
              {cart.length === 0 ? (
                <div style={{background:"#fff",borderRadius:"12px",padding:"60px",textAlign:"center"}}>
                  <div style={{fontSize:"64px",marginBottom:"16px"}}>🛒</div>
                  <p style={{color:"#6B7280",fontSize:"16px",marginBottom:"20px"}}>Your cart is empty</p>
                  <button onClick={()=>setPage("shop")} style={{background:"#1a1a1a",color:"#fff",
                    border:"none",padding:"12px 24px",borderRadius:"8px",cursor:"pointer",fontSize:"14px"}}>
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  {cart.map(item => (
                    <div key={item.id} style={{background:"#fff",borderRadius:"10px",
                      padding:"16px",display:"flex",alignItems:"center",gap:"16px",
                      boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                      <div style={{fontSize:"48px",width:"64px",textAlign:"center"}}>{item.image}</div>
                      <div style={{flex:1}}>
                        <h4 style={{fontSize:"15px",fontWeight:"600",color:"#1a1a1a",marginBottom:"4px"}}>
                          {item.name}
                        </h4>
                        <p style={{fontSize:"13px",color:"#6B7280"}}>{item.category}</p>
                        <p style={{fontSize:"16px",fontWeight:"700",color:"#1a1a1a",marginTop:"4px"}}>
                          ${(item.price * item.qty).toFixed(2)}
                        </p>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        <button onClick={()=>updateQty(item.id, item.qty-1)} style={{
                          width:"28px",height:"28px",border:"1.5px solid #E5E7EB",
                          borderRadius:"6px",cursor:"pointer",background:"#fff",fontSize:"16px"}}>
                          −
                        </button>
                        <span style={{width:"24px",textAlign:"center",fontWeight:"600"}}>{item.qty}</span>
                        <button onClick={()=>updateQty(item.id, item.qty+1)} style={{
                          width:"28px",height:"28px",border:"1.5px solid #E5E7EB",
                          borderRadius:"6px",cursor:"pointer",background:"#fff",fontSize:"16px"}}>
                          +
                        </button>
                        <button onClick={()=>removeFromCart(item.id)} style={{
                          marginLeft:"8px",background:"#FEE2E2",color:"#EF4444",border:"none",
                          padding:"6px 10px",borderRadius:"6px",cursor:"pointer",fontSize:"13px"}}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Form */}
            {cart.length > 0 && (
              <div style={{background:"#fff",borderRadius:"12px",padding:"24px",
                boxShadow:"0 2px 12px rgba(0,0,0,0.08)",position:"sticky",top:"80px"}}>
                <h3 style={{fontSize:"18px",fontWeight:"700",marginBottom:"20px",color:"#1a1a1a"}}>
                  Order Summary
                </h3>
                <div style={{marginBottom:"20px",paddingBottom:"20px",
                  borderBottom:"1px solid #F3F4F6"}}>
                  {cart.map(i => (
                    <div key={i.id} style={{display:"flex",justifyContent:"space-between",
                      fontSize:"13px",color:"#6B7280",marginBottom:"6px"}}>
                      <span>{i.name} × {i.qty}</span>
                      <span>${(i.price*i.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",
                    fontWeight:"700",fontSize:"16px",color:"#1a1a1a",marginTop:"12px"}}>
                    <span>Total</span>
                    <span style={{color:"#D4AF37"}}>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                {orderPlaced ? (
                  <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:"8px",
                    padding:"16px",textAlign:"center"}}>
                    <div style={{fontSize:"32px",marginBottom:"8px"}}>✅</div>
                    <p style={{fontWeight:"600",color:"#15803D"}}>Order #{orderPlaced.id} Confirmed!</p>
                    <button onClick={()=>{setOrderPlaced(null);setPage("shop")}} style={{
                      marginTop:"12px",background:"#1a1a1a",color:"#fff",border:"none",
                      padding:"8px 16px",borderRadius:"6px",cursor:"pointer",fontSize:"13px"}}>
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    {[
                      {label:"Full Name",    key:"customerName", type:"text",  ph:"John Doe"},
                      {label:"Email",        key:"email",        type:"email", ph:"john@email.com"},
                      {label:"Address",      key:"address",      type:"text",  ph:"123 Main St, City"},
                    ].map(f => (
                      <div key={f.key} style={{marginBottom:"14px"}}>
                        <label style={{fontSize:"12px",fontWeight:"600",color:"#374151",
                          display:"block",marginBottom:"4px",letterSpacing:"0.5px"}}>
                          {f.label.toUpperCase()}
                        </label>
                        <input type={f.type} placeholder={f.ph}
                          value={checkoutForm[f.key]}
                          onChange={e=>setCheckoutForm(p=>({...p,[f.key]:e.target.value}))}
                          style={{width:"100%",padding:"10px 12px",border:"1.5px solid #E5E7EB",
                            borderRadius:"8px",fontSize:"14px",outline:"none",boxSizing:"border-box"}}/>
                      </div>
                    ))}
                    <button onClick={placeOrder} style={{
                      width:"100%",background:"#1a1a1a",color:"#fff",border:"none",
                      padding:"14px",borderRadius:"8px",cursor:"pointer",fontSize:"15px",
                      fontWeight:"600",letterSpacing:"0.5px",marginTop:"8px",
                      transition:"background .2s"}}
                      onMouseEnter={e=>e.target.style.background="#D4AF37"}
                      onMouseLeave={e=>e.target.style.background="#1a1a1a"}>
                      Place Order
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS PAGE ── */}
        {page === "orders" && (
          <div>
            <h2 style={{fontSize:"24px",fontWeight:"700",marginBottom:"20px",color:"#1a1a1a"}}>
              Order History
            </h2>
            {orders.length === 0 ? (
              <div style={{background:"#fff",borderRadius:"12px",padding:"60px",textAlign:"center"}}>
                <div style={{fontSize:"64px",marginBottom:"16px"}}>📦</div>
                <p style={{color:"#6B7280",fontSize:"16px"}}>No orders yet</p>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                {orders.map(order => (
                  <div key={order.id} style={{background:"#fff",borderRadius:"10px",
                    padding:"20px",boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",
                      alignItems:"center",marginBottom:"12px"}}>
                      <div>
                        <h4 style={{fontSize:"16px",fontWeight:"700",color:"#1a1a1a"}}>
                          Order #{order.id}
                        </h4>
                        <p style={{fontSize:"12px",color:"#9CA3AF",marginTop:"2px"}}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <span style={{background:"#F0FDF4",color:"#15803D",padding:"4px 12px",
                          borderRadius:"20px",fontSize:"12px",fontWeight:"600"}}>
                          {order.status}
                        </span>
                        <p style={{fontSize:"18px",fontWeight:"700",color:"#D4AF37",marginTop:"4px"}}>
                          ${order.total}
                        </p>
                      </div>
                    </div>
                    <p style={{fontSize:"13px",color:"#6B7280"}}>
                      📦 {order.items.length} item(s) · 👤 {order.customerName} · 📍 {order.address}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
