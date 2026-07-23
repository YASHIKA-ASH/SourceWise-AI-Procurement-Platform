import Button from "../common/Button";
import Input from "../common/Input";

export default function SupplierModal() {
  return (
    <div
      style={{
        background: "#fff",
        padding: 30,
        borderRadius: 10,
      }}
    >
      <h2>Add Supplier</h2>

      <Input placeholder="Supplier Name" />

      <br />
      <br />

      <Input placeholder="Location" />

      <br />
      <br />

      <Input placeholder="Price" />

      <br />
      <br />

      <Button>Save</Button>
    </div>
  );
}