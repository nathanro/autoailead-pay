"use client";

import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import { useEffect, useMemo, useState } from "react";
import type { Lead } from "@/lib/types";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

export function LeadsDashboardGrid() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/leads");
      const data = (await res.json()) as { leads: Lead[] };
      setLeads(data.leads);
      setLoading(false);
    })();
  }, []);

  const columnDefs = useMemo<ColDef<Lead>[]>(
    () => [
      { field: "name", headerName: "Lead", flex: 1, minWidth: 120 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 160 },
      {
        field: "serviceInterest",
        headerName: "Service",
        flex: 1,
        minWidth: 140,
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        cellClass: "capitalize",
      },
      {
        headerName: "Deposit",
        width: 110,
        valueGetter: (p) =>
          p.data?.quote
            ? `$${(p.data.quote.depositCents / 100).toFixed(2)}`
            : p.data?.amountCents
              ? `$${(p.data.amountCents / 100).toFixed(2)}`
              : "—",
      },
      {
        field: "paypalOrderId",
        headerName: "PayPal order",
        flex: 1,
        minWidth: 160,
      },
      {
        field: "updatedAt",
        headerName: "Updated",
        width: 180,
        valueFormatter: (p) =>
          p.value ? new Date(String(p.value)).toLocaleString() : "",
      },
    ],
    [],
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        AG Grid community view of leads, quotes, and PayPal payment status.
      </p>
      <div
        className="ag-theme-quartz dark:ag-theme-quartz-dark h-[min(520px,60vh)] w-full min-h-[320px]"
        style={{ width: "100%" }}
      >
        <AgGridReact<Lead>
          rowData={leads}
          columnDefs={columnDefs}
          defaultColDef={{ sortable: true, filter: true, resizable: true }}
          animateRows
          loading={loading}
          overlayLoadingTemplate='<span class="ag-overlay-loading-center">Loading leads…</span>'
          overlayNoRowsTemplate='<span class="ag-overlay-loading-center">No leads yet—start a chat on the home page.</span>'
        />
      </div>
    </div>
  );
}
