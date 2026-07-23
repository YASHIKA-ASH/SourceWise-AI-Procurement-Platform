export default function Card({ children }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 5px 15px rgba(0,0,0,.05)",
      }}
    >
      {children}
    </div>
  );
}