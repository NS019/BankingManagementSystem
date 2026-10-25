// useMemo: "kharcheela calculation ka jawab yaad rakho". Dependency list ki koi value badle
// tabhi dobara calculate hota hai. Alternate: bina useMemo ke seedha compute karna.
// 5-10 rows par wo bhi theek chalta, par hazaaron rows par har keystroke (search box)
// poori list dobara filter karti, jo UI ko atka deti hai. Isliye useMemo.
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import FormField from "../components/FormField";
import { getAccounts, getAllTransactions } from "../api/accountService";

// Filters ki shuruaati values component ke BAHAR constant. "Clear filters" dabane par
// yahi object wapas set karenge. Bahar rakhne se har render par naya object nahi banta.
// "ALL" ek sentinel value hai: matlab "is filter ko mat lagao". "" (khaali string) bhi
// chalta, par dropdown mein "ALL" padhne mein saaf hai.
const INITIAL_FILTERS = { accountId: "ALL", type: "ALL", search: "", from: "", to: "" };

export default function TransactionHistory() {
  // RAW data: sirf wahi jo server se aaya. Filtered list ko yahan state mein NAHI rakha.
  const [accounts, setAccounts] = useState([]);
  const [txns, setTxns] = useState([]);

  // Loading true se shuru: pehle render par hi "Loading" dikhe, aur effect ke andar
  // synchronous setLoading(true) na karna pade (naya lint rule use galat maanta hai).
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // User ki saari filter choices ek object mein (Transfer ke form jaisa hi pattern).
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  useEffect(() => {
    let ignore = false; // purani request ka jawab naye data ko overwrite na kare (race condition)

    const load = async () => {
      try {
        // Promise.all: dono calls ek saath, toh 500ms mein dono aate hain (sequential mein 900ms lagte).
        const [accs, list] = await Promise.all([getAccounts(), getAllTransactions()]);
        if (!ignore) {
          setAccounts(accs);
          setTxns(list);
        }
      } catch {
        if (!ignore) setError("History load nahi ho paayi. Dobara try karo.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();

    return () => {
      ignore = true; // cleanup: component hatne par flag true
    };
  }, []); // [] = sirf pehli baar. Filters badalne par server call NAHI hoti (filtering frontend par hai).

  // Ek handler sab inputs ke liye (name attribute se field pehchaante hain).
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // accountId se account dhundne ke liye lookup object: { 1: {...}, 2: {...} }.
  // Table ki har row par accounts.find() chalana O(n) hota, jo rows x accounts baar chalta.
  // Object lookup O(1) hai. Chhote data par farak nahi dikhta, par ye aadat achhi hai.
  const accountById = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a])),
    [accounts] // accounts badle tabhi dobara banao
  );

  // YAHI HAI DERIVED STATE: raw txns + filters se filtered list nikaali, state mein save nahi ki.
  // txns ya filters badle toh apne aap sahi list milti hai. Alag state hoti toh dono ko
  // sync rakhna padta, aur wo "stale data" bug ki sabse badi wajah hai.
  const filtered = useMemo(() => {
    // Search text ek baar lowercase karke rakha, har row par dobara nahi.
    // trim(): sirf spaces likhne par "kuch search nahi" maana jaaye.
    const q = filters.search.trim().toLowerCase();

    return (
      txns
        // Har .filter() ek NAYA array deta hai, original txns state ko chhuta nahi.
        // Ek bade .filter() mein sab conditions bhi daal sakte the (thoda fast hota),
        // par alag alag likhne se har filter ka matlab padhne mein saaf rehta hai.
        .filter((t) => filters.accountId === "ALL" || t.accountId === Number(filters.accountId))
        .filter((t) => filters.type === "ALL" || t.type === filters.type)
        .filter((t) => !q || t.description.toLowerCase().includes(q))
        // Dates "YYYY-MM-DD" string hain. Is format mein string comparison bhi sahi chalta hai
        // ("2026-10-05" < "2026-10-12"), kyunki saal-mahina-din order mein hain.
        // Agar format "05/10/2026" hota toh ye galat jawab deta. Production mein hamesha
        // ISO format (ya timestamp) mein date store karte hain, isi wajah se.
        .filter((t) => !filters.from || t.date >= filters.from)
        .filter((t) => !filters.to || t.date <= filters.to)
        // sort() original array ko BADAL deta hai (mutation). Yahan safe hai kyunki filter() ne
        // pehle hi naya array bana diya. Seedha txns.sort() karte toh state mutate hoti.
        // localeCompare se date string compare, aur same date par id se tie-break (naya upar).
        .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    );
  }, [txns, filters]);

  // Totals bhi derived: filtered list se nikale. Filter badla toh totals apne aap badal gaye.
  // reduce() poori list ko ek value mein samet deta hai: yahan {credit, debit} object mein.
  // Paisa jodne ke liye abhi number theek hai. Backend mein BigDecimal hoga (float rounding se bachne ke liye).
  const totals = useMemo(
    () =>
      filtered.reduce(
        (sum, t) => {
          if (t.type === "CREDIT") sum.credit += t.amount;
          else sum.debit += t.amount;
          return sum;
        },
        { credit: 0, debit: 0 } // reduce ki shuruaati value
      ),
    [filtered]
  );

  // Cheap check hai (sirf do string compare), isliye useMemo ki zaroorat nahi. Har cheez
  // memoize karna bhi galat hai, kyunki useMemo ka apna chhota overhead hota hai.
  const rangeInvalid = filters.from && filters.to && filters.from > filters.to;

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px" }}>
        <h2>Transaction History</h2>

        {/* Filter panel: CSS grid, har column kam se kam 170px, jagah kam ho toh neeche wrap. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          <FormField label="Account" name="accountId">
            <select id="accountId" name="accountId" value={filters.accountId} onChange={handleChange} style={{ display: "block", width: "100%" }}>
              <option value="ALL">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.type} · {a.accountNumber}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Type" name="type">
            <select id="type" name="type" value={filters.type} onChange={handleChange} style={{ display: "block", width: "100%" }}>
              <option value="ALL">All</option>
              <option value="CREDIT">Credit</option>
              <option value="DEBIT">Debit</option>
            </select>
          </FormField>

          <FormField label="Search description" name="search" value={filters.search} onChange={handleChange} placeholder="e.g. salary" />

          {/* type="date" browser ka built-in date picker deta hai aur value "YYYY-MM-DD" mein aati hai,
              jo hamari mock dates ke format se match karta hai. */}
          <FormField label="From" name="from" type="date" value={filters.from} onChange={handleChange} />
          <FormField label="To" name="to" type="date" value={filters.to} onChange={handleChange} />
        </div>

        {rangeInvalid && (
          <p role="alert" style={{ color: "crimson" }}>From date, To date se baad ki hai. Dates theek karo.</p>
        )}

        {/* type="button": filters form nahi hain, par aadat daalo. Form ke andar hota toh submit ho jaata. */}
        <button type="button" onClick={() => setFilters(INITIAL_FILTERS)} style={{ marginTop: 12 }}>
          Clear filters
        </button>

        {loading && <p>Loading history...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* Loading ya error ke time summary/table nahi dikhate, warna "0 of 0" jaisa jhootha data dikhta. */}
        {!loading && !error && (
          <>
            {/* Summary: kitni rows dikh rahi hain aur unka total. */}
            <p style={{ marginTop: 16 }}>
              Showing <strong>{filtered.length}</strong> of {txns.length} transactions ·{" "}
              <span style={{ color: "green" }}>Credit +₹{totals.credit.toLocaleString("en-IN")}</span> ·{" "}
              <span style={{ color: "crimson" }}>Debit -₹{totals.debit.toLocaleString("en-IN")}</span>
            </p>

            {/* Empty state ZAROORI: filter lagane par kuch na mile toh saaf message dikhao.
                Khaali table dekhkar user ko lagta hai app toot gayi. */}
            {filtered.length === 0 ? (
              <p>Koi transaction nahi mila. Filters badal ke dekho.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid #ccc" }}>
                    <th>Date</th>
                    <th>Account</th>
                    <th>Description</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    // key={t.id}: database ka unique id. Filter badalne par list ke items
                    // add/remove hote hain, isliye index ko key banana yahan galat hota.
                    <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td>{t.date}</td>
                      {/* ?. optional chaining: account na mile (undefined) toh crash nahi,
                          bas "-" dikhta hai. Real data mein ye ho sakta hai (deleted account). */}
                      <td>{accountById[t.accountId]?.type ?? "-"}</td>
                      <td>{t.description}</td>
                      {/* +/- sign bhi dikhaya, sirf rang par bharosa nahi (color-blind users ke liye). */}
                      <td style={{ textAlign: "right", color: t.type === "CREDIT" ? "green" : "crimson" }}>
                        {t.type === "CREDIT" ? "+" : "-"}₹{t.amount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </>
  );
}