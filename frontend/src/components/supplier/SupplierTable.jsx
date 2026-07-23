import { useState } from "react";
import {
  Search,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";

export default function SupplierTable({ suppliers = [] }) {
  const [search, setSearch] = useState("");

  const filtered = suppliers.filter((supplier) =>
    supplier.name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 25,
        boxShadow: "0 5px 15px rgba(0,0,0,.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "8px 12px",
            width: 300,
          }}
        >
          <Search size={18} />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search supplier..."
            style={{
              border: "none",
              outline: "none",
              width: "100%",
            }}
          />
        </div>

        <button
          style={{
            background: "#2563EB",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      <table
        width="100%"
        style={{
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#F8FAFC",
            }}
          >
            <th>Name</th>
            <th>Location</th>
            <th>Price</th>
            <th>Lead Time</th>
            <th>Rating</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((supplier) => (
            <tr
              key={supplier.id}
              style={{
                borderBottom:
                  "1px solid #eee",
              }}
            >
              <td>{supplier.name}</td>

              <td>{supplier.location}</td>

              <td>
                ₹{supplier.price}
              </td>

              <td>
                {supplier.lead_time} days
              </td>

              <td>
                ⭐ {supplier.rating}
              </td>

              <td>
                <span
                  style={{
                    background:
                      "#DCFCE7",
                    color: "#15803D",
                    padding:
                      "4px 10px",
                    borderRadius: 20,
                  }}
                >
                  Active
                </span>
              </td>

              <td>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                  }}
                >
                  <Pencil
                    size={18}
                    color="#2563EB"
                    style={{
                      cursor: "pointer",
                    }}
                  />

                  <Trash2
                    size={18}
                    color="#EF4444"
                    style={{
                      cursor: "pointer",
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}