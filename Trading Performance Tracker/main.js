import { TradeManager } from './tradeManager.js';
import { ChartManager } from './chartManager.js';
import { Utils } from './utils.js';

class TradingApp {
    constructor() {
        this.tradeManager = new TradeManager();
        this.chartManager = new ChartManager();
        this.utils = new Utils();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTrades();
        this.updateDashboard();
    }

    bindEvents() {
        // Modal events
        const addTradeBtn = document.getElementById('addTradeBtn');
        const modal = document.getElementById('addTradeModal');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = document.getElementById('cancelBtn');
        const tradeForm = document.getElementById('tradeForm');

        addTradeBtn.addEventListener('click', () => this.showModal());
        closeBtn.addEventListener('click', () => this.hideModal());
        cancelBtn.addEventListener('click', () => this.hideModal());
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.hideModal();
        });

        // Form submission
        tradeForm.addEventListener('submit', (e) => this.handleTradeSubmit(e));

        // Filter events
        document.getElementById('symbolFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('typeFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('sortBy').addEventListener('change', () => this.applyFilters());

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());

        // Set default date to today
        document.getElementById('date').valueAsDate = new Date();
    }

    showModal() {
        document.getElementById('addTradeModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        document.getElementById('addTradeModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.resetForm();
    }

    resetForm() {
        document.getElementById('tradeForm').reset();
        document.getElementById('date').valueAsDate = new Date();
    }

    handleTradeSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const trade = {
            id: Date.now().toString(),
            symbol: formData.get('symbol') || document.getElementById('symbol').value,
            type: formData.get('type') || document.getElementById('type').value,
            entryPrice: parseFloat(document.getElementById('entryPrice').value),
            exitPrice: parseFloat(document.getElementById('exitPrice').value),
            quantity: parseFloat(document.getElementById('quantity').value),
            date: document.getElementById('date').value,
            notes: document.getElementById('notes').value,
            timestamp: new Date().toISOString()
        };

        // Calculate P&L
        if (trade.type === 'buy') {
            trade.pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity;
        } else {
            trade.pnl = (trade.entryPrice - trade.exitPrice) * trade.quantity;
        }

        this.tradeManager.addTrade(trade);
        this.hideModal();
        this.loadTrades();
        this.updateDashboard();
    }

    loadTrades() {
        const trades = this.tradeManager.getAllTrades();
        this.renderTradesTable(trades);
        this.updateSymbolFilter(trades);
    }

    renderTradesTable(trades) {
        const tbody = document.getElementById('tradesTableBody');
        
        if (trades.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <h3>No trades recorded yet</h3>
                        <p>Click "Add New Trade" to get started</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = trades.map(trade => `
            <tr>
                <td>${this.utils.formatDate(trade.date)}</td>
                <td><strong>${trade.symbol.toUpperCase()}</strong></td>
                <td><span class="trade-type ${trade.type}">${trade.type.toUpperCase()}</span></td>
                <td>$${trade.entryPrice.toFixed(2)}</td>
                <td>$${trade.exitPrice.toFixed(2)}</td>
                <td>${trade.quantity}</td>
                <td class="${trade.pnl >= 0 ? 'positive' : 'negative'}">
                    $${trade.pnl.toFixed(2)}
                </td>
                <td>
                    <button class="btn btn-danger" onclick="app.deleteTrade('${trade.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateSymbolFilter(trades) {
        const symbolFilter = document.getElementById('symbolFilter');
        const symbols = [...new Set(trades.map(trade => trade.symbol))];
        
        symbolFilter.innerHTML = '<option value="">All Symbols</option>' +
            symbols.map(symbol => `<option value="${symbol}">${symbol.toUpperCase()}</option>`).join('');
    }

    applyFilters() {
        const symbolFilter = document.getElementById('symbolFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        
        let filteredTrades = this.tradeManager.getAllTrades();

        // Apply filters
        if (symbolFilter) {
            filteredTrades = filteredTrades.filter(trade => trade.symbol === symbolFilter);
        }
        if (typeFilter) {
            filteredTrades = filteredTrades.filter(trade => trade.type === typeFilter);
        }

        // Apply sorting
        filteredTrades.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.date) - new Date(a.date);
                case 'pnl':
                    return b.pnl - a.pnl;
                case 'symbol':
                    return a.symbol.localeCompare(b.symbol);
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });

        this.renderTradesTable(filteredTrades);
    }

    updateDashboard() {
        const trades = this.tradeManager.getAllTrades();
        const stats = this.tradeManager.calculateStats(trades);

        // Update summary cards
        document.getElementById('totalPnL').textContent = `$${stats.totalPnL.toFixed(2)}`;
        document.getElementById('totalPnL').className = `metric-value ${stats.totalPnL >= 0 ? 'positive' : 'negative'}`;
        
        document.getElementById('winRate').textContent = `${stats.winRate.toFixed(1)}%`;
        document.getElementById('totalTrades').textContent = stats.totalTrades;
        document.getElementById('avgWin').textContent = `$${stats.avgWin.toFixed(2)}`;
        document.getElementById('avgLoss').textContent = `$${Math.abs(stats.avgLoss).toFixed(2)}`;
        document.getElementById('bestTrade').textContent = `$${stats.bestTrade.toFixed(2)}`;

        // Update charts
        this.chartManager.updatePerformanceChart(trades);
        this.chartManager.updateDistributionChart(trades);
    }

    deleteTrade(tradeId) {
        if (confirm('Are you sure you want to delete this trade?')) {
            this.tradeManager.deleteTrade(tradeId);
            this.loadTrades();
            this.updateDashboard();
        }
    }

    exportData() {
        const trades = this.tradeManager.getAllTrades();
        if (trades.length === 0) {
            alert('No trades to export');
            return;
        }

        const csvContent = this.utils.convertToCSV(trades);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `trading_journal_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}

// Initialize the app
const app = new TradingApp();

// Make app globally available for event handlers
window.app = app;