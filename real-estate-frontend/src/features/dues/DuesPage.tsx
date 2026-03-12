import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, CheckCircle2, Clock, CreditCard, Search, TriangleAlert } from "lucide-react";
import type { DuesSummary, Installment, PaymentMethod } from "@/types";

type View = "OVERDUE" | "DUE" | "PAID";

function formatINR(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function toISODate(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toISOString().slice(0, 10);
}

const DuesPage: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [summary, setSummary] = useState<DuesSummary | null>(null);
  const [items, setItems] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<View>("OVERDUE");
  const [search, setSearch] = useState("");

  const [payOpen, setPayOpen] = useState(false);
  const [selected, setSelected] = useState<Installment | null>(null);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("UPI");
  const [payRef, setPayRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [summaryRes, listRes] = await Promise.all([
        apiClient.get("/api/dues/summary"),
        apiClient.get("/api/installments", {
          params:
            view === "OVERDUE"
              ? { overdue: true }
              : view === "DUE"
                ? { status: "DUE" }
                : { status: "PAID" },
        }),
      ]);

      setSummary(summaryRes.data.data ?? summaryRes.data);
      setItems(listRes.data.data ?? listRes.data);
    } catch {
      toast.error("Failed to load dues dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, view]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => {
      const plot = i.sale?.plot?.plotNumber ?? "";
      const project = i.sale?.plot?.project?.name ?? "";
      const ref = i.reference ?? "";
      return (
        String(i.number).includes(q) ||
        String(i.saleId).toLowerCase().includes(q) ||
        plot.toLowerCase().includes(q) ||
        project.toLowerCase().includes(q) ||
        ref.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const openPay = (inst: Installment) => {
    setSelected(inst);
    setPayAmount(inst.amount);
    setPayMethod("UPI");
    setPayRef("");
    setPayOpen(true);
  };

  const submitPay = async () => {
    if (!selected) return;
    if (payAmount === "" || Number(payAmount) <= 0) {
      toast.error("Enter a valid paid amount");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.patch(`/api/installments/${selected.id}/pay`, {
        paidAmount: Number(payAmount),
        method: payMethod,
        reference: payRef.trim() || undefined,
      });
      toast.success("Installment marked as paid");
      setPayOpen(false);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark installment paid");
    } finally {
      setSubmitting(false);
    }
  };

  const cards = [
    {
      title: "Overdue",
      value: formatINR(Number(summary?.overdueAmount ?? 0)),
      sub: `${summary?.overdueCount ?? 0} installments`,
      icon: TriangleAlert,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      title: "Due (Next 7 Days)",
      value: formatINR(Number(summary?.dueNext7DaysAmount ?? 0)),
      sub: `${summary?.dueNext7DaysCount ?? 0} installments`,
      icon: Calendar,
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
    {
      title: "Total Due",
      value: formatINR(Number(summary?.dueAmount ?? 0)),
      sub: `${summary?.dueCount ?? 0} installments`,
      icon: Clock,
      color: "text-indigo-700",
      bg: "bg-indigo-50",
    },
    {
      title: "Paid (This Month)",
      value: formatINR(Number(summary?.paidThisMonthAmount ?? 0)),
      sub: `${summary?.paidThisMonthCount ?? 0} payments`,
      icon: CheckCircle2,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dues Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track EMI / installment dues and collections</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={view} onValueChange={(v) => setView(v as View)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="DUE">Due</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => fetchAll()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <div className={`h-9 w-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search by project, plot, sale ID, installment #, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Plot</TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No installments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((i) => {
                    const project = i.sale?.plot?.project?.name ?? "—";
                    const plot = i.sale?.plot?.plotNumber ?? "—";
                    const due = toISODate(i.dueDate);
                    const overdue = i.status === "DUE" && new Date(i.dueDate) < new Date();
                    const badge =
                      i.status === "PAID"
                        ? "bg-emerald-100 text-emerald-700"
                        : i.status === "WAIVED"
                          ? "bg-slate-100 text-slate-700"
                          : overdue
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800";

                    return (
                      <TableRow key={i.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{project}</TableCell>
                        <TableCell>{plot}</TableCell>
                        <TableCell>{i.number}</TableCell>
                        <TableCell>{due}</TableCell>
                        <TableCell>{formatINR(i.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badge}>
                            {i.status === "DUE" && overdue ? "OVERDUE" : i.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {i.status === "DUE" ? (
                            <Button size="sm" variant="outline" onClick={() => openPay(i)}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Mark Paid
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {i.status === "PAID" ? `Paid ${i.paidAt ? toISODate(i.paidAt) : ""}` : "—"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Installment Paid</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-3 bg-muted/40">
              <p className="text-sm font-medium">
                {selected?.sale?.plot?.project?.name ?? "—"} • Plot {selected?.sale?.plot?.plotNumber ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Installment #{selected?.number} • Due {selected?.dueDate ? toISODate(selected.dueDate) : "—"} • Amount{" "}
                {selected ? formatINR(selected.amount) : "—"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid Amount (₹)</Label>
              <Input
                id="paidAmount"
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value === "" ? "" : Number(e.target.value))}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference (optional)</Label>
              <Input
                id="reference"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="e.g. UPI txn id / bank ref"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setPayOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={submitPay} disabled={submitting}>
              {submitting ? "Saving..." : "Confirm Paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DuesPage;

