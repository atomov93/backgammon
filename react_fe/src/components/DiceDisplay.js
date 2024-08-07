// src/components/DiceDisplay.js
import React from 'react';

const DiceDisplay = ({ diceValues }) => {
  return (
    <div className="dice_display">
      {diceValues.map((value, index) => (
        <img key={index} src={`res/dice_${value}.svg`} alt={`Dice ${value}`} />
      ))}
    </div>
  );
};

export default DiceDisplay;
