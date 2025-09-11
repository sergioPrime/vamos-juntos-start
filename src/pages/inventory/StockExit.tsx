import { StockExitForm } from "@/components/inventory/StockExitForm"

const StockExitPage = () => {
  return (
    <div className="page-container container mx-auto p-6">
      <StockExitForm onSuccess={() => window.close()} />
    </div>
  )
}

export default StockExitPage