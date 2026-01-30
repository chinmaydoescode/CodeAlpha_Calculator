/**
 * MODERN CALCULATOR APPLICATION
 * 
 * A fully functional calculator with:
 * - Basic arithmetic operations (+, -, ×, ÷)
 * - Decimal support
 * - Keyboard input
 * - Clear and backspace functionality
 * - Chain operations support
 * - Error handling (division by zero, etc.)
 */

// ===========================
// CALCULATOR STATE MODULE
// ===========================
const CalculatorState = (() => {
    let currentOperand = '0';
    let previousOperand = '';
    let operation = null;
    let shouldResetScreen = false;

    return {
        getCurrentOperand: () => currentOperand,
        getPreviousOperand: () => previousOperand,
        getOperation: () => operation,
        getShouldResetScreen: () => shouldResetScreen,
        
        setCurrentOperand: (value) => { currentOperand = value; },
        setPreviousOperand: (value) => { previousOperand = value; },
        setOperation: (value) => { operation = value; },
        setShouldResetScreen: (value) => { shouldResetScreen = value; },
        
        reset: () => {
            currentOperand = '0';
            previousOperand = '';
            operation = null;
            shouldResetScreen = false;
        }
    };
})();

// ===========================
// DISPLAY CONTROLLER
// ===========================
const DisplayController = (() => {
    const currentOperandElement = document.getElementById('currentOperand');
    const previousOperandElement = document.getElementById('previousOperand');

    /**
     * Format number for display with proper decimal handling
     * @param {string} number - The number to format
     * @returns {string} Formatted number string
     */
    const formatNumber = (number) => {
        if (number === '') return '';
        
        const floatNumber = parseFloat(number);
        
        // Handle invalid numbers
        if (isNaN(floatNumber)) return '0';
        
        // Handle very large or very small numbers with scientific notation
        if (Math.abs(floatNumber) > 999999999999 || (Math.abs(floatNumber) < 0.000001 && floatNumber !== 0)) {
            return floatNumber.toExponential(6);
        }
        
        // Format with proper decimal places (max 10 digits)
        return floatNumber.toLocaleString('en-US', {
            maximumFractionDigits: 10
        });
    };

    /**
     * Update the calculator display
     */
    const updateDisplay = () => {
        const current = CalculatorState.getCurrentOperand();
        const previous = CalculatorState.getPreviousOperand();
        const operation = CalculatorState.getOperation();

        // Update current operand display
        currentOperandElement.textContent = formatNumber(current);

        // Update previous operand display with operation
        if (operation != null && previous !== '') {
            previousOperandElement.textContent = `${formatNumber(previous)} ${operation}`;
        } else {
            previousOperandElement.textContent = '';
        }
    };

    return {
        update: updateDisplay
    };
})();

// ===========================
// CALCULATION ENGINE
// ===========================
const CalculationEngine = (() => {
    /**
     * Perform calculation based on operator
     * @param {number} prev - Previous operand
     * @param {number} current - Current operand
     * @param {string} operator - Operation to perform
     * @returns {number} Result of calculation
     */
    const compute = (prev, current, operator) => {
        const prevNum = parseFloat(prev);
        const currentNum = parseFloat(current);

        // Validate inputs
        if (isNaN(prevNum) || isNaN(currentNum)) return 0;

        let result;
        switch (operator) {
            case '+':
                result = prevNum + currentNum;
                break;
            case '−':
                result = prevNum - currentNum;
                break;
            case '×':
                result = prevNum * currentNum;
                break;
            case '÷':
                // Handle division by zero
                if (currentNum === 0) {
                    alert('Error: Cannot divide by zero');
                    return 0;
                }
                result = prevNum / currentNum;
                break;
            default:
                return currentNum;
        }

        return result;
    };

    /**
     * Execute the calculation
     */
    const calculate = () => {
        const current = CalculatorState.getCurrentOperand();
        const previous = CalculatorState.getPreviousOperand();
        const operation = CalculatorState.getOperation();

        // Need both operands and an operation
        if (previous === '' || operation == null) return;

        const result = compute(previous, current, operation);
        
        // Update state with result
        CalculatorState.setCurrentOperand(result.toString());
        CalculatorState.setOperation(null);
        CalculatorState.setPreviousOperand('');
        CalculatorState.setShouldResetScreen(true);
    };

    return {
        calculate
    };
})();

// ===========================
// INPUT HANDLER
// ===========================
const InputHandler = (() => {
    /**
     * Append a number or decimal to current operand
     * @param {string} number - Number or decimal point to append
     */
    const appendNumber = (number) => {
        // Reset screen if needed (after equals or operation)
        if (CalculatorState.getShouldResetScreen()) {
            CalculatorState.setCurrentOperand('0');
            CalculatorState.setShouldResetScreen(false);
        }

        let current = CalculatorState.getCurrentOperand();

        // Prevent multiple decimal points
        if (number === '.' && current.includes('.')) return;

        // Replace initial zero unless adding decimal
        if (current === '0' && number !== '.') {
            CalculatorState.setCurrentOperand(number);
        } else {
            CalculatorState.setCurrentOperand(current + number);
        }

        DisplayController.update();
    };

    /**
     * Set the operation and prepare for next operand
     * @param {string} operator - The operator to set
     */
    const setOperation = (operator) => {
        const current = CalculatorState.getCurrentOperand();
        const previous = CalculatorState.getPreviousOperand();
        const existingOperation = CalculatorState.getOperation();

        // If there's no current number, just change the operator
        if (current === '') return;

        // If previous exists, calculate before setting new operation
        if (previous !== '' && existingOperation != null && !CalculatorState.getShouldResetScreen()) {
            CalculationEngine.calculate();
        }

        // Set up for next operation
        CalculatorState.setOperation(operator);
        CalculatorState.setPreviousOperand(CalculatorState.getCurrentOperand());
        CalculatorState.setShouldResetScreen(true);

        DisplayController.update();
    };

    /**
     * Clear all calculator state
     */
    const clear = () => {
        CalculatorState.reset();
        DisplayController.update();
    };

    /**
     * Delete the last character from current operand
     */
    const backspace = () => {
        let current = CalculatorState.getCurrentOperand();
        
        // If screen should reset, clear instead
        if (CalculatorState.getShouldResetScreen()) {
            clear();
            return;
        }

        // Remove last character
        if (current.length > 1) {
            CalculatorState.setCurrentOperand(current.slice(0, -1));
        } else {
            CalculatorState.setCurrentOperand('0');
        }

        DisplayController.update();
    };

    /**
     * Execute equals operation
     */
    const equals = () => {
        CalculationEngine.calculate();
        DisplayController.update();
    };

    return {
        appendNumber,
        setOperation,
        clear,
        backspace,
        equals
    };
})();

// ===========================
// EVENT LISTENERS MODULE
// ===========================
const EventListeners = (() => {
    /**
     * Add visual feedback for button press
     * @param {HTMLElement} button - Button element to animate
     */
    const animateButton = (button) => {
        if (!button) return;
        
        button.classList.add('active');
        setTimeout(() => {
            button.classList.remove('active');
        }, 100);
    };

    /**
     * Initialize click event listeners for calculator buttons
     */
    const initClickListeners = () => {
        // Number buttons
        document.querySelectorAll('[data-number]').forEach(button => {
            button.addEventListener('click', () => {
                const number = button.dataset.number;
                InputHandler.appendNumber(number);
                animateButton(button);
            });
        });

        // Operator buttons
        document.querySelectorAll('[data-operator]').forEach(button => {
            button.addEventListener('click', () => {
                const operator = button.dataset.operator;
                InputHandler.setOperation(operator);
                animateButton(button);
            });
        });

        // Action buttons
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                
                switch (action) {
                    case 'clear':
                        InputHandler.clear();
                        break;
                    case 'backspace':
                        InputHandler.backspace();
                        break;
                    case 'equals':
                        InputHandler.equals();
                        break;
                }
                
                animateButton(button);
            });
        });
    };

    /**
     * Map keyboard keys to calculator buttons and operations
     * @param {string} key - The keyboard key pressed
     * @returns {Object|null} Mapped button element and action
     */
    const mapKeyToButton = (key) => {
        const keyMap = {
            // Numbers
            '0': '[data-number="0"]',
            '1': '[data-number="1"]',
            '2': '[data-number="2"]',
            '3': '[data-number="3"]',
            '4': '[data-number="4"]',
            '5': '[data-number="5"]',
            '6': '[data-number="6"]',
            '7': '[data-number="7"]',
            '8': '[data-number="8"]',
            '9': '[data-number="9"]',
            '.': '[data-number="."]',
            
            // Operators
            '+': '[data-operator="+"]',
            '-': '[data-operator="−"]',
            '*': '[data-operator="×"]',
            '/': '[data-operator="÷"]',
            
            // Actions
            'Enter': '[data-action="equals"]',
            '=': '[data-action="equals"]',
            'Backspace': '[data-action="backspace"]',
            'Delete': '[data-action="backspace"]',
            'Escape': '[data-action="clear"]',
            'c': '[data-action="clear"]',
            'C': '[data-action="clear"]'
        };

        const selector = keyMap[key];
        if (!selector) return null;

        const button = document.querySelector(selector);
        return button;
    };

    /**
     * Initialize keyboard event listeners
     */
    const initKeyboardListeners = () => {
        document.addEventListener('keydown', (e) => {
            // Prevent default for calculator keys
            if (['/', '*', '-', '+', 'Enter', 'Escape'].includes(e.key)) {
                e.preventDefault();
            }

            const button = mapKeyToButton(e.key);
            
            if (!button) return;

            // Trigger button click
            button.click();
            
            // Visual feedback
            animateButton(button);
        });
    };

    /**
     * Initialize all event listeners
     */
    const init = () => {
        initClickListeners();
        initKeyboardListeners();
    };

    return {
        init
    };
})();

// ===========================
// APPLICATION INITIALIZATION
// ===========================
const App = (() => {
    /**
     * Initialize the calculator application
     */
    const init = () => {
        // Set initial display
        DisplayController.update();
        
        // Initialize all event listeners
        EventListeners.init();
        
        console.log('Calculator initialized successfully! 🧮');
        console.log('Keyboard shortcuts:');
        console.log('  • Numbers: 0-9');
        console.log('  • Decimal: .');
        console.log('  • Operators: +, -, *, /');
        console.log('  • Equals: Enter or =');
        console.log('  • Clear: Escape or C');
        console.log('  • Backspace: Backspace or Delete');
    };

    return {
        init
    };
})();

// Initialize the app when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}
