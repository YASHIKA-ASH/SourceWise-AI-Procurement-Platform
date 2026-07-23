import Card from "../common/Card";

export default function StatCard({
  title,
  value,
  color,
}) {
  return (
    <Card>
      <p>{title}</p>

      <h1
        style={{
          color,
          fontSize: 34,
        }}
      >
        {value}
      </h1>
    </Card>
  );
}