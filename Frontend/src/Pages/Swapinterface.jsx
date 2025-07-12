/* SwapInterface.jsx */
import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft, Calculator, DollarSign, CheckCircle, AlertCircle,
  TrendingUp, User as UserIcon, MessageCircle, X, Loader, Info, Wallet
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* 1 ▸ MOCK DATA – pretend these came from your API                    */
/* ------------------------------------------------------------------ */
const MOCK_USER_LISTINGS = [
  /* Your active items */
  {
    id: 101,
    title: 'Vintage Denim Jacket',
    category: 'Jacket',
    brand: 'Levi’s',
    condition: 'Excellent',
    final_price: 45,
    image_url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=60'
  },
  {
    id: 102,
    title: 'Eco Cotton Dress',
    category: 'Dress',
    brand: 'Zara',
    condition: 'Like New',
    final_price: 35,
    image_url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=60'
  },
  {
    id: 103,
    title: 'Leather Chelsea Boots',
    category: 'Shoes',
    brand: 'Dr. Martens',
    condition: 'Good',
    final_price: 70,
    image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400&q=60'
  }
];

const MOCK_AVAILABLE_LISTINGS = [
  /* Items owned by other users */
  {
    id: 201,
    title: 'Graphic Tee',
    category: 'T-Shirt',
    brand: 'H&M',
    condition: 'Excellent',
    final_price: 18,
    owner_name: 'Alex',
    owner_avatar: 'https://randomuser.me/api/portraits/men/15.jpg',
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=60'
  },
  {
    id: 202,
    title: 'Running Sneakers',
    category: 'Shoes',
    brand: 'Nike',
    condition: 'Good',
    final_price: 55,
    owner_name: 'Priya',
    owner_avatar: 'https://randomuser.me/api/portraits/women/26.jpg',
    image_url: 'https://images.unsplash.com/photo-1584680226833-0fe473b3f4fd?auto=format&fit=crop&w=400&q=60'
  },
  {
    id: 203,
    title: 'Leather Cross-Body Bag',
    category: 'Accessories',
    brand: 'Coach',
    condition: 'Like New',
    final_price: 90,
    owner_name: 'Hiro',
    owner_avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    image_url: 'https://images.unsplash.com/photo-1593032457862-f8940c4b4186?auto=format&fit=crop&w=400&q=60'
  }
];

/* ------------------------------------------------------------------ */
/* 2 ▸ HELPERS                                                         */
/* ------------------------------------------------------------------ */
const fairnessColour = (ratio) => {
  if (ratio >= 0.95) return 'text-green-600 bg-green-100';
  if (ratio >= 0.85) return 'text-blue-600 bg-blue-100';
  if (ratio >= 0.75) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};
const fairnessLabel = (ratio) => {
  if (ratio >= 0.95) return 'Excellent';
  if (ratio >= 0.85) return 'Good';
  if (ratio >= 0.75) return 'Fair';
  return 'Poor';
};

/* Core maths – you can tweak thresholds / rounding logic here */
const analyseSwap = (myItem, theirItem) => {
  const myVal   = myItem.final_price;
  const theirVal = theirItem.final_price;
  const diff     = myVal - theirVal;              // +ve ⇒ you’re offering higher value
  const extra    = Math.abs(diff) > 5 ? Math.abs(diff) : 0; // ignore tiny gaps
  return {
    initiatorValue : myVal,
    receiverValue  : theirVal,
    priceDifference: diff,
    extraPayment   : extra,
    paymentDirection: extra === 0
      ? null
      : diff > 0
        ? 'receiver_pays'   // they need to top-up
        : 'initiator_pays', // you need to top-up
    fairnessRatio  : Math.min(myVal, theirVal) / Math.max(myVal, theirVal)
  };
};

/* ------------------------------------------------------------------ */
/* 3 ▸ COMPONENT                                                       */
/* ------------------------------------------------------------------ */
export default function SwapInterface () {
  /* data */
  const [userListings      ] = useState(MOCK_USER_LISTINGS);
  const [availableListings ] = useState(MOCK_AVAILABLE_LISTINGS);

  /* selections & UI state */
  const [myItem     , setMyItem     ] = useState(null);
  const [theirItem  , setTheirItem  ] = useState(null);
  const [analysis   , setAnalysis   ] = useState(null);
  const [message    , setMessage    ] = useState('');
  const [filterText , setFilterText ] = useState('');
  const [filterCat  , setFilterCat  ] = useState('');
  const [calcBusy   , setCalcBusy   ] = useState(false);
  const [confirmBox , setConfirmBox ] = useState(false);

  /* categories for dropdown */
  const categories = [...new Set(MOCK_AVAILABLE_LISTINGS.map(i => i.category))];

  /* when both items selected, “calculate” (simulated async) */
  useEffect(() => {
    if (!myItem || !theirItem) return;
    setCalcBusy(true);
    setAnalysis(null);
    const timer = setTimeout(() => {
      setAnalysis(analyseSwap(myItem, theirItem));
      setCalcBusy(false);
    }, 600);                       // mimic network latency
    return () => clearTimeout(timer);
  }, [myItem, theirItem]);

  /* filtered partner items */
  const partnerFiltered = availableListings.filter(i => {
    const matchTxt = (i.title + i.brand).toLowerCase().includes(filterText.toLowerCase());
    const matchCat = filterCat ? i.category === filterCat : true;
    return matchTxt && matchCat;
  });

  /* ---------------------------------------------------------------- */
  /* render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* ──────────────── Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-4 flex items-center justify-center gap-3">
            <ArrowRightLeft className="h-8 w-8 text-orange-600" />
            Smart Swap Interface
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Compare item values in real-time and send fair swap requests.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ──────────────── Your items (left) */}
          <section className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-orange-600" />
              Your Active Items
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {userListings.map(card => (
                <button
                  key={card.id}
                  onClick={() => setMyItem(card)}
                  className={`w-full text-left p-4 border-2 rounded-xl flex gap-3 transition
                    ${myItem?.id === card.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-stone-200 hover:border-orange-300 hover:bg-stone-50'}`}
                >
                  <img src={card.image_url} alt={card.title}
                       className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-stone-800">{card.title}</h3>
                    <p className="text-xs text-stone-500">
                      {card.category} • {card.condition}
                    </p>
                    <span className="text-orange-600 font-bold">${card.final_price}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ──────────────── Analysis (middle) */}
          <section className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              Swap Analysis
            </h2>

            {(!myItem || !theirItem) && (
              <Placeholder icon={<Info className="h-12 w-12 text-stone-300" />}
                           label="Pick items on both sides to compare" />
            )}

            {calcBusy && (
              <Placeholder icon={<Loader className="h-8 w-8 animate-spin text-orange-600" />}
                           label="Calculating..." />
            )}

            {analysis && (
              <>
                {/* value cards */}
                <ItemPair a={myItem} b={theirItem} />

                {/* fairness */}
                <div className="bg-stone-50 rounded-lg p-4 my-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">Fairness Analysis</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold
                      ${fairnessColour(analysis.fairnessRatio)}`}>
                      {fairnessLabel(analysis.fairnessRatio)}
                    </span>
                  </div>
                  <StatRow label="Price Difference"
                           value={`$${Math.abs(analysis.priceDifference)}`} />
                  <StatRow label="Ratio"
                           value={`${Math.round(analysis.fairnessRatio * 100)}%`} />
                </div>

                {/* extra payment */}
                {analysis.extraPayment > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-800">Extra Payment Required</span>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      ${analysis.extraPayment}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {analysis.paymentDirection === 'initiator_pays'
                        ? 'You need to pay the difference'
                        : 'They need to pay the difference'}
                    </p>
                  </div>
                )}

                {/* message + button */}
                <textarea
                  rows={3}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Add a note to your request (optional)…"
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2
                             focus:ring-orange-500 focus:border-orange-500"/>
                <button
                  disabled={!analysis}
                  onClick={() => setConfirmBox(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white
                             py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-600
                             transition disabled:opacity-50 flex items-center justify-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" /> Request Swap
                </button>
              </>
            )}
          </section>

          {/* ──────────────── Partner items (right) */}
          <section className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Available Items
            </h2>

            {/* filters */}
            <input
              placeholder="Search..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3
                         focus:ring-2 focus:ring-orange-500 focus:border-orange-500"/>
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4">
              <option value="">All categories</option>
              {categories.map(cat => <option key={cat}>{cat}</option>)}
            </select>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {partnerFiltered.map(card => (
                <button key={card.id}
                        onClick={() => setTheirItem(card)}
                        className={`w-full text-left p-4 border-2 rounded-xl flex gap-3 transition
                          ${theirItem?.id === card.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-stone-200 hover:border-blue-300 hover:bg-stone-50'}`}>
                  <img src={card.image_url} alt={card.title}
                       className="w-12 h-12 rounded-lg object-cover"/>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-stone-800">{card.title}</h3>
                    <p className="text-xs text-stone-500">
                      {card.category} • {card.condition}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-orange-600 font-bold">${card.final_price}</span>
                      <div className="flex items-center gap-1">
                        <img src={card.owner_avatar} alt={card.owner_name}
                             className="w-4 h-4 rounded-full"/>
                        <span className="text-xs text-stone-400">{card.owner_name}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ──────────────── confirmation modal */}
      {confirmBox && analysis && (
        <Modal onClose={() => setConfirmBox(false)}>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600"/> Confirm Swap
          </h3>

          <div className="space-y-4 mb-6 text-sm">
            <SummaryRow title="You send"   item={myItem}/>
            <SummaryRow title="You receive" item={theirItem}/>

            {analysis.extraPayment > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p>
                  <strong>${analysis.extraPayment}</strong> difference — 
                  {analysis.paymentDirection === 'initiator_pays'
                    ? 'you pay the extra via wallet'
                    : 'they pay you the extra'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => { alert('Mock request sent!'); setConfirmBox(false); }}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white
                       py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-600
                       transition mb-3">
            Send Request
          </button>
          <button
            onClick={() => setConfirmBox(false)}
            className="w-full border border-stone-300 py-3 rounded-xl font-semibold
                       text-stone-600 hover:bg-stone-50 transition">
            Cancel
          </button>
        </Modal>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────── helpers */

const Placeholder = ({ icon, label }) => (
  <div className="text-center py-12">
    {icon}
    <p className="text-stone-500 mt-4">{label}</p>
  </div>
);

const ItemPair = ({ a, b }) => (
  <div className="grid grid-cols-2 gap-4 mb-6">
    {[a,b].map((it,i)=>(
      <div key={i} className="text-center">
        <img src={it.image_url} alt={it.title}
             className="w-16 h-16 rounded-lg object-cover mx-auto mb-2"/>
        <p className="text-sm font-medium text-stone-800">{it.title}</p>
        <p className="text-lg font-bold text-green-600">${it.final_price}</p>
      </div>
    ))}
  </div>
);

const StatRow = ({ label, value }) => (
  <div className="flex justify-between mb-1 text-sm">
    <span className="text-stone-600">{label}</span>
    <span className="font-bold text-stone-800">{value}</span>
  </div>
);

const SummaryRow = ({ title, item }) => (
  <div className="flex items-center gap-3 bg-stone-50 p-3 rounded">
    <img src={item.image_url} alt={item.title}
         className="w-10 h-10 rounded-lg object-cover"/>
    <div className="flex-1">
      <p className="text-stone-600 text-xs mb-1">{title}</p>
      <p className="font-semibold">{item.title}</p>
    </div>
    <p className="font-bold text-orange-600">${item.final_price}</p>
  </div>
);

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center
                  justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
      <button onClick={onClose}
              className="absolute top-3 right-3 text-stone-400 hover:text-red-500">
        <X className="h-6 w-6"/>
      </button>
      {children}
    </div>
  </div>
);
