import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaixaClosedScreenProps {
  onOpenCaixa: () => void;
}

export const CaixaClosedScreen = ({ onOpenCaixa }: CaixaClosedScreenProps) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-160px)] bg-white dark:bg-gray-950">
      <div className="text-center max-w-2xl px-6">
        {/* Icon container */}
        <div className="mb-10 flex justify-center">
          <div className="relative">
            <div className="w-56 h-56 flex items-center justify-center">
              {/* Cash register icon */}
              <svg 
                viewBox="0 0 200 200" 
                className="w-full h-full"
                style={{ fill: "#20b5d5" }}
              >
                {/* Base */}
                <rect x="25" y="115" width="150" height="55" rx="6" />
                {/* Drawer */}
                <rect x="35" y="125" width="130" height="35" rx="4" fill="#fff" stroke="#20b5d5" strokeWidth="3" />
                {/* Drawer handle */}
                <rect x="90" y="138" width="20" height="8" rx="2" fill="#20b5d5" />
                {/* Display */}
                <rect x="65" y="65" width="70" height="45" rx="4" />
                {/* Display screen */}
                <rect x="70" y="70" width="60" height="25" rx="2" fill="#fff" opacity="0.3" />
                {/* Paper roll */}
                <rect x="40" y="72" width="22" height="38" rx="3" />
                <path d="M 40 82 Q 28 82 28 92 Q 28 102 40 102" fill="#fff" />
                {/* Buttons grid */}
                <g fill="#fff">
                  <circle cx="85" cy="95" r="3.5" />
                  <circle cx="95" cy="95" r="3.5" />
                  <circle cx="105" cy="95" r="3.5" />
                  <circle cx="115" cy="95" r="3.5" />
                  <circle cx="85" cy="105" r="3.5" />
                  <circle cx="95" cy="105" r="3.5" />
                  <circle cx="105" cy="105" r="3.5" />
                  <circle cx="115" cy="105" r="3.5" />
                </g>
              </svg>
              
              {/* Alert badge */}
              <div className="absolute -top-3 -right-3 w-[72px] h-[72px] bg-[#d9534f] rounded-full flex items-center justify-center shadow-xl">
                <AlertCircle className="w-11 h-11 text-white" strokeWidth={2.8} />
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 
          className="text-gray-800 dark:text-gray-200 mb-12 leading-[1.6]"
          style={{ fontSize: '26px', fontWeight: 400, letterSpacing: '0.01em' }}
        >
          Seu caixa não está aberto, é necessário abrir o<br />
          caixa para poder realizar vendas pelo PDV.
        </h1>

        {/* Button */}
        <Button
          onClick={onOpenCaixa}
          className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-medium rounded shadow-sm transition-colors"
          style={{ 
            fontSize: '16px', 
            padding: '14px 36px',
            height: 'auto',
            minWidth: '180px'
          }}
        >
          Abrir meu caixa
        </Button>
      </div>
    </div>
  );
};
