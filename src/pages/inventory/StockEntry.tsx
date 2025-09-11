import { StockEntryForm } from "@/components/inventory/StockEntryForm"

const StockEntryPage = () => {
  return (
    <div className="page-container container mx-auto p-6">
      <StockEntryForm onSuccess={() => window.close()} />
    </div>
  )
}

export default StockEntryPage