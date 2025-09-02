import { ReturnManagement } from "@/components/inventory/ReturnManagement"

const ReturnsPage = () => {
  return (
    <div className="container mx-auto p-6">
      <ReturnManagement onSuccess={() => window.close()} />
    </div>
  )
}

export default ReturnsPage