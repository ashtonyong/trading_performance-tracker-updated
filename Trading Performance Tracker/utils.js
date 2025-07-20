export class Utils {
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatPercentage(value) {
        return `${value.toFixed(1)}%`;
    }

    convertToCSV(trades) {
        if (trades.length === 0) return '';

        const headers = ['Date', 'Symbol', 'Type', 'Entry Price', 'Exit Price', 'Quantity', 'P&L', 'Notes'];
        const csvRows = [headers.join(',')];

        trades.forEach(trade => {
            const row = [
                trade.date,
                trade.symbol,
                trade.type,
                trade.entryPrice,
                trade.exitPrice,
                trade.quantity,
                trade.pnl.toFixed(2),
                `"${trade.notes || ''}"`
            ];
            csvRows.push(row.join(','));
        });

        return csvRows.join('\n');
    }

    validateTradeData(trade) {
        const errors = [];

        if (!trade.symbol || trade.symbol.trim() === '') {
            errors.push('Symbol is required');
        }

        if (!trade.type || !['buy', 'sell'].includes(trade.type)) {
            errors.push('Valid trade type is required');
        }

        if (!trade.entryPrice || trade.entryPrice <= 0) {
            errors.push('Entry price must be greater than 0');
        }

        if (!trade.exitPrice || trade.exitPrice <= 0) {
            errors.push('Exit price must be greater than 0');
        }

        if (!trade.quantity || trade.quantity <= 0) {
            errors.push('Quantity must be greater than 0');
        }

        if (!trade.date) {
            errors.push('Date is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    calculateRiskReward(entryPrice, exitPrice, stopLoss, tradeType) {
        if (tradeType === 'buy') {
            const reward = exitPrice - entryPrice;
            const risk = entryPrice - stopLoss;
            return risk > 0 ? reward / risk : 0;
        } else {
            const reward = entryPrice - exitPrice;
            const risk = stopLoss - entryPrice;
            return risk > 0 ? reward / risk : 0;
        }
    }

    getDateRange(trades) {
        if (trades.length === 0) return { start: null, end: null };

        const dates = trades.map(trade => new Date(trade.date));
        return {
            start: new Date(Math.min(...dates)),
            end: new Date(Math.max(...dates))
        };
    }

    groupTradesByPeriod(trades, period = 'month') {
        const groups = {};

        trades.forEach(trade => {
            const date = new Date(trade.date);
            let key;

            switch (period) {
                case 'day':
                    key = date.toISOString().split('T')[0];
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'year':
                    key = date.getFullYear().toString();
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(trade);
        });

        return groups;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    sanitizeInput(input) {
        return input.toString().trim().replace(/[<>]/g, '');
    }

    calculateDrawdown(cumulativePnL) {
        if (cumulativePnL.length === 0) return { maxDrawdown: 0, currentDrawdown: 0 };

        let peak = cumulativePnL[0];
        let maxDrawdown = 0;
        let currentDrawdown = 0;

        for (let i = 1; i < cumulativePnL.length; i++) {
            if (cumulativePnL[i] > peak) {
                peak = cumulativePnL[i];
            }
            
            const drawdown = peak - cumulativePnL[i];
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }

        // Current drawdown
        const currentPeak = Math.max(...cumulativePnL);
        const currentValue = cumulativePnL[cumulativePnL.length - 1];
        currentDrawdown = currentPeak - currentValue;

        return { maxDrawdown, currentDrawdown };
    }
}