import { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import SupplierTable from "../components/supplier/SupplierTable";
import api from "../api/api";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      const res = await api.get("/suppliers/");
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Layout>
      <h1
        style={{
          marginBottom: 20,
        }}
      >
        Supplier Management
      </h1>

      <SupplierTable suppliers={suppliers} />
    </Layout>
  );
}