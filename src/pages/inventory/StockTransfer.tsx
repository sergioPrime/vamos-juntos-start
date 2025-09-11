import { StockTransferForm } from "@/components/inventory/StockTransferForm"

const StockTransferPage = () => {
  return (
    <div className="page-container container mx-auto p-6">
      <StockTransferForm onSuccess={() => window.close()} />
    </div>
  )
}

export default StockTransferPage