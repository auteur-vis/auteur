import React, { useState, useEffect, useRef } from 'react';

export const FormulaBuilder = ({ setFormula, dataPoint }) => {
    function getNumericalVariables(dataPoint) {
        console.log(dataPoint)
        const numericalValue = Object.entries(dataPoint)
          .filter(([key, value]) => typeof value === 'number' && !key.includes('.') && key != 'y1'&& key != 'x1' && key != 'y2' && key != 'x2' && key != 'delty'&& key != 'y')
          .map(([key]) => key);
        return numericalValue
      }
      
  const [multipliers, setMultipliers] = useState({});
  const [formulaString, setFormulaString] = useState("");
  const [numericalVariables] = useState(getNumericalVariables(dataPoint));

  const handleMultiplierChange = (variable, value) => {
    setMultipliers({
      ...multipliers,
      [variable]: value
    });
  };

  const generateFormula = () => {
    const formulaParts = [];
    for (const variable of numericalVariables) {
      const multiplier = multipliers[variable] || '0'; 
      if (multiplier !== '0') {
        formulaParts.push(`(${multiplier} * d.${variable})`);
      }
    }
    const formula = formulaParts.join(" + ");
    setFormulaString(formula);
    setFormula(`return ${formula};`)
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Formula Builder</h2>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        {numericalVariables.map((variable, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
            <label>
                {variable}:
                <input
                type="text"
                defaultValue="0"
                onChange={(e) => handleMultiplierChange(variable, e.target.value)}
                style={{ marginLeft: '10px', width: '60px' }}
                />
            </label>
            {index !== numericalVariables.length - 1 && <span style={{ marginLeft: '10px' }}>+</span>}
            </div>
        ))}
        </div>

      <button onClick={generateFormula} style={{ marginTop: '20px' }}>Generate Formula</button>
      {formulaString && (
        <div style={{ marginTop: '20px' }}>
          <strong>Generated Formula:</strong>
          <pre>{`${formulaString}`}</pre>
        </div>
      )}
    </div>
  );
};
