import { useEffect } from "react";
import { useReactiveSystem, useReactiveValue, useReactiveFormula } from "src/Engine/ReactiveProvider";

function PricingCalculator() {
  const { formulaEngine } = useReactiveSystem();
  const [price, setPrice] = useReactiveValue<number>('price', 100);
  const [quantity, setQuantity] = useReactiveValue<number>('quantity', 1);
  const [discountPercent, setDiscountPercent] = useReactiveValue<number>('discountPercent', 0);
  
  // Create formulas
  const subtotal = useReactiveFormula<number>('subtotal', '$price * $quantity');
  const discount = useReactiveFormula<number>('discount', '$subtotal * ($discountPercent / 100)');
  const total = useReactiveFormula<number>('total', '$subtotal - $discount');
  
  // Format currency
  useEffect(() => {
    formulaEngine.addCustomFunction('formatCurrency', (value: number) => {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(value);
    });
  }, [formulaEngine]);
  
  const formattedTotal = useReactiveFormula<string>('formattedTotal', 'formatCurrency($total)');
  
  return (
    <div className="pricing-calculator">
      <h2>Pricing Calculator</h2>
      
      <div className="form-group">
        <label>Price ($):</label>
        <input 
          type="number" 
          value={price} 
          onChange={(e) => setPrice(Number(e.target.value))}
          min="0"
        />
      </div>
      
      <div className="form-group">
        <label>Quantity:</label>
        <input 
          type="number" 
          value={quantity} 
          onChange={(e) => setQuantity(Number(e.target.value))}
          min="1"
        />
      </div>
      
      <div className="form-group">
        <label>Discount (%):</label>
        <input 
          type="range" 
          value={discountPercent} 
          onChange={(e) => setDiscountPercent(Number(e.target.value))}
          min="0"
          max="100"
        />
        <span>{discountPercent}%</span>
      </div>
      
      <div className="result">
        <div>Subtotal: ${subtotal?.toFixed(2) || '0.00'}</div>
        <div>Discount: ${discount?.toFixed(2) || '0.00'}</div>
        <h3>Total: {formattedTotal || '$0.00'}</h3>
      </div>
    </div>
  );
}
