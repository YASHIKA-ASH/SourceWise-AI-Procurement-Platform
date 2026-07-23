import { useEffect, useState } from "react";
import { updateSupplier } from "../api/supplier";

export default function EditSupplierModal({
  open,
  onClose,
  supplier,
  refresh,
}) {
  const [form, setForm] = useState({
    name: "",
    material: "",
    country: "",
    price_per_unit: "",
    lead_time: "",
    quality_score: "",
    defect_rate: "",
    on_time_delivery: "",
    sustainability_score: "",
  });

  useEffect(() => {
    if (supplier) {
      setForm(supplier);
    }
  }, [supplier]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submit = async () => {
    await updateSupplier(form.id, {
      ...form,
      price_per_unit: Number(form.price_per_unit),
      lead_time: Number(form.lead_time),
      quality_score: Number(form.quality_score),
      defect_rate: Number(form.defect_rate),
      on_time_delivery: Number(form.on_time_delivery),
      sustainability_score: Number(form.sustainability_score),
    });

    refresh();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 550,
          background: "#131C2E",
          padding: 25,
          borderRadius: 10,
        }}
      >
        <h2>Edit Supplier</h2>

        {Object.keys(form)
          .filter((key) => key !== "id")
          .map((field) => (
            <input
              key={field}
              name={field}
              value={form[field]}
              onChange={handleChange}
              placeholder={field}
              style={{
                width: "100%",
                marginTop: 10,
                padding: 10,
              }}
            />
          ))}

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 10,
          }}
        >
          <button onClick={submit}>
            Update
          </button>

          <button onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}