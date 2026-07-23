export default function Button(props) {
  return (
    <button
      {...props}
      style={{
        background: "#2563EB",
        color: "#fff",
        border: "none",
        padding: "10px 18px",
        borderRadius: 8,
        cursor: "pointer",
      }}
    />
  );
}