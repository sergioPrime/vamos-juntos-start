import { AlertCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaixaClosedScreenProps {
  onOpenCaixa: () => void;
}

export const CaixaClosedScreen = ({ onOpenCaixa }: CaixaClosedScreenProps) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-white">
      <div className="text-center max-w-lg px-6">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-48 h-48 flex items-center justify-center">
              {/* Cash register icon */}
              <svg 
                viewBox="0 0 200 200" 
                className="w-full h-full"
                style={{ fill: "#20b5d5" }}
              >
                {/* Base */}
                <rect x="30" y="120" width="140" height="50" rx="5" />
                {/* Drawer */}
                <rect x="40" y="130" width="120" height="30" rx="3" fill="#fff" stroke="#20b5d5" strokeWidth="2" />
                {/* Display */}
                <rect x="70" y="70" width="60" height="40" rx="3" />
                {/* Paper roll */}
                <rect x="45" y="75" width="20" height="35" rx="2" />
                <path d="M 45 85 Q 35 85 35 95 Q 35 105 45 105" fill="#fff" />
                {/* Buttons */}
                <g fill="#fff">
                  <circle cx="90" cy="100" r="3" />
                  <circle cx="100" cy="100" r="3" />
                  <circle cx="110" cy="100" r="3" />
                  <circle cx="90" cy="110" r="3" />
                  <circle cx="100" cy="110" r="3" />
                  <circle cx="110" cy="110" r="3" />
                </g>
              </svg>
              
              {/* Alert badge */}
              <div className="absolute -top-2 -right-2 w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <AlertCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-normal text-gray-900 mb-8 leading-relaxed">
          Seu caixa não está aberto, é necessário abrir o<br />
          caixa para poder realizar vendas pelo PDV.
        </h1>

        <Button
          onClick={onOpenCaixa}
          size="lg"
          className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-8 py-6 text-base font-medium rounded-md"
        >
          Abrir meu caixa
        </Button>
      </div>
    </div>
  );
};
