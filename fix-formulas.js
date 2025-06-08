const fs = require('fs');
const path = require('path');

const files = [
  'examples/reactive-system-test.json',
  'examples/formula-syntax-comparison.json', 
  'examples/pricingModel.json'
];

files.forEach(filePath => {
  console.log(`Processing ${filePath}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const notebook = JSON.parse(content);
    
    // Update formula cells
    notebook.cells = notebook.cells.map(cell => {
      if (cell.type === 'formula') {
        // Keep only required properties
        return {
          type: cell.type,
          id: cell.id,
          variableName: cell.variableName,
          formula: cell.formula
        };
      }
      return cell;
    });
    
    // Write back
    fs.writeFileSync(filePath, JSON.stringify(notebook, null, 2));
    console.log(`✓ Updated ${filePath}`);
    
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
});

console.log('Done!');
