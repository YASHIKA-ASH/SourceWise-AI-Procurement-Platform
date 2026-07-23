import Card from "../common/Card";

export default function SupplierTable({ suppliers }) {
  return (
    <Card>
      <table
        width="100%"
        cellPadding="12"
        style={{
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Location</th>
            <th>Price</th>
            <th>Lead Time</th>
            <th>Rating</th>
          </tr>
        </thead>

        <tbody>
          {suppliers.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.location}</td>
              <td>₹{s.price}</td>
              <td>{s.lead_time}</td>
              <td>{s.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}