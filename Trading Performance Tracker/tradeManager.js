export class TradeManager {
    constructor() {
        this.trades = this.loadFromStorage();
    }

    addTrade(trade) {
        this.trades.push(trade);
        this.saveToStorage();
    }

    deleteTrade(tradeId) {
        this.trades = this.trades.filter(trade => trade.id !== tradeId);
        this.saveToStorage();
    }

    getAllTrades() {
        return [...this.trades].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getTradesBySymbol(symbol) {
        return this.trades.filter(trade => trade.symbol === symbol);
    }

    getTradesByDateRange(startDate, endDate) {
        return this.trades.filter(trade => {
            const tradeDate = new Date(trade.date);
            return tradeDate >= startDate && tradeDate <= endDate;
        });
    }

    calculateStats(trades = this.trades) {
        if (trades.length === 0) {
            return {
                totalPnL: 0,
                winRate: 0,
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0,
                avgWin: 0,
                avgLoss: 0,
                bestTrade: 0,
                worstTrade: 0,
                profitFactor: 0
            };
        }

        const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
        const winningTrades = trades.filter(trade => trade.pnl > 0);
        const losingTrades = trades.filter(trade => trade.pnl < 0);
        
        const totalWins = winningTrades.reduce((sum, trade) => sum + trade.pnl, 0);
        const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.pnl, 0));
        
        const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
        const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
        
        const bestTrade = trades.length > 0 ? Math.max(...trades.map(t => t.pnl)) : 0;
        const worstTrade = trades.length > 0 ? Math.min(...trades.map(t => t.pnl)) : 0;
        
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

        return {
            totalPnL,
            winRate,
            totalTrades: trades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            avgWin,
            avgLoss: -avgLoss, // Keep negative for display
            bestTrade,
            worstTrade,
            profitFactor
        };
    }

    getCumulativePnL(trades = this.trades) {
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
        let cumulative = 0;
        
        return sortedTrades.map(trade => {
            cumulative += trade.pnl;
            return {
                date: trade.date,
                cumulativePnL: cumulative,
                trade: trade
            };
        });
    }

    getSymbolPerformance() {
        const symbolStats = {};
        
        this.trades.forEach(trade => {
            if (!symbolStats[trade.symbol]) {
                symbolStats[trade.symbol] = {
                    symbol: trade.symbol,
                    totalPnL: 0,
                    tradeCount: 0,
                    winCount: 0
                };
            }
            
            symbolStats[trade.symbol].totalPnL += trade.pnl;
            symbolStats[trade.symbol].tradeCount += 1;
            if (trade.pnl > 0) {
                symbolStats[trade.symbol].winCount += 1;
            }
        });

        return Object.values(symbolStats).map(stat => ({
            ...stat,
            winRate: (stat.winCount / stat.tradeCount) * 100,
            avgPnL: stat.totalPnL / stat.tradeCount
        }));
    }

    saveToStorage() {
        localStorage.setItem('tradingJournal', JSON.stringify(this.trades));
    }

    loadFromStorage() {
        const data = localStorage.getItem('tradingJournal');
        return data ? JSON.parse(data) : [];
    }

    clearAllTrades() {
        this.trades = [];
        this.saveToStorage();
    }

    importTrades(tradesData) {
        try {
            const newTrades = JSON.parse(tradesData);
            if (Array.isArray(newTrades)) {
                this.trades = [...this.trades, ...newTrades];
                this.saveToStorage();
                return true;
            }
        } catch (error) {
            console.error('Error importing trades:', error);
        }
        return false;
    }
}