import { useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function App() {
  const [quantity, setQuantity] = useState(10000);
  const [inventory, setInventory] = useState(7000);
  const [dailyUsage, setDailyUsage] = useState(500);
  const [result, setResult] = useState(null);

  const simulate = async () => {
    const res = await axios.post("http://127.0.0.1:8000/simulate", {
      quantity,
      inventory,
      daily_usage: dailyUsage,
    });

    setResult(res.data);
  };

  return (
    <div style={{ padding: 30, background: "#eef2f7", minHeight: "100vh" }}>

      <h1>SourceWise</h1>
<h3>AI Procurement Decision Support System</h3>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(4,1fr)",
        gap:20,
        marginTop:20
      }}>

<Card title="Suppliers" value="3"/>
<Card title="Avg Lead Time" value="13.3 Days"/>
<Card title="Lowest Cost" value="₹398"/>
<Card title="Risk Index" value="Low"/>

      </div>

      <div style={box}>

        <h2>Simulation</h2>

        <input value={quantity} onChange={e=>setQuantity(Number(e.target.value))} placeholder="Quantity"/>

        <input value={inventory} onChange={e=>setInventory(Number(e.target.value))} placeholder="Inventory"/>

        <input value={dailyUsage} onChange={e=>setDailyUsage(Number(e.target.value))} placeholder="Daily Usage"/>

        <button onClick={simulate}>Run Simulation</button>

      </div>

      {result && (

        <>
          <div style={box}>

            <h2>AI Recommendation</h2>
            <hr/>

<h3>Business Summary</h3>

<ul>
<li> Lowest Procurement Risk</li>
<li> No Production Delay</li>
<li> Inventory Sufficient</li>
<li> Highest Supplier Score</li>
</ul>

            <h1 style={{color:"green"}}>
              {result.best_supplier.supplier}
            </h1>

            <p>Cost : ₹ {result.best_supplier.cost.toLocaleString()}</p>

            <p>Lead Time : {result.best_supplier.lead_time} Days</p>

            <p>Delay : {result.best_supplier.delay_days} Days</p>

            <p>Score : {result.best_supplier.score}</p>
            <p>
Production Loss :
₹ {result.best_supplier.production_loss.toLocaleString()}
</p>
            <p>{result.best_supplier.reason}</p>

          </div>

          <div style={box}>

            <h2>Supplier Comparison</h2>

            <table width="100%">

              <thead>

              <tr>

              <th>Supplier</th>

              <th>Cost</th>
              <th>Recommendation</th>


              <th>Lead Time</th>

              <th>Delay</th>

              <th>Score</th>

              </tr>

              </thead>

              <tbody>

              {result.comparison.map((s)=>(
                <tr key={s.supplier}>

                <td>{s.supplier}</td>

                <td>{s.cost.toLocaleString()}</td>

                <td>{s.recommendation}</td>

<td>{s.lead_time}</td>

<td>{s.delay_days}</td>

<td>{s.score}</td>

                </tr>
              ))}

              </tbody>

            </table>

          </div>

          <div style={box}>

            <h2>Cost Comparison</h2>

            <ResponsiveContainer width="100%" height={300}>

              <BarChart data={result.comparison}>

                <XAxis dataKey="supplier"/>

                <YAxis/>

                <Tooltip/>

                <Bar dataKey="cost"/>

              </BarChart>

            </ResponsiveContainer>

          </div>
          <div style={box}>

<h2>Lead Time Comparison</h2>

<ResponsiveContainer width="100%" height={300}>

<BarChart data={result.comparison}>

<XAxis dataKey="supplier"/>

<YAxis/>

<Tooltip/>

<Bar dataKey="lead_time"/>

</BarChart>

</ResponsiveContainer>

</div>
         

        </>

      )}

    </div>
  );
}




function Card({title,value}){

return(

<div style={{
background:"white",
padding:20,
borderRadius:10,
boxShadow:"0 4px 10px rgba(0,0,0,.1)"
}}>

<h4>{title}</h4>

<h1>{value}</h1>

</div>

)

}

const box={

background:"white",

padding:25,

marginTop:25,

borderRadius:12,

boxShadow:"0 4px 12px rgba(0,0,0,.1)"

}
