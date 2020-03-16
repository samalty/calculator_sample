import React, { Component } from 'react';
import './Calculator.css';

class Calculator extends Component {
    constructor(props){
        super(props)
        this.state = {
            visible: false,
            rate: 0,
            expenses: 0,
            totalFees: 0,
            incomeTax: 0,
            nationalInsurance: 0,
            combined: 0,
            insideAnnual: 0,
            insideMonthly: 0,
            earnings: 0,
            corporationTax: 0,
            incomeTaxOutside: 0,
            combinedOutside: 0,
            outsideAnnual: 0,
            outsideMonthly: 0
        }
    }
    
    handleInputChange = (event) => {
        event.preventDefault()
        this.setState({
            [event.target.name]: parseInt(event.target.value, 10)
        }, () => {
            this.setState({
                totalFees: this.state.rate * 220,
                earnings: (this.state.rate * 220) - this.state.expenses
            })
        })
    }

    handleSubmit = (event) => {
        event.preventDefault()
        
        // Inside IR35 calculation

        const totalFees = this.state.totalFees;

        const insideTax = this.handleInsideTax(totalFees);
        const incomeTax = insideTax[0].toFixed(2);
        const nationalInsurance = insideTax[1].toFixed(2);
        const combined = insideTax[2].toFixed(2);

        const insideFees = this.handleInsideFees(totalFees, combined);
        const insideAnnual = insideFees[0].toFixed(2);
        const insideMonthly = insideFees[1].toFixed(2);

        // Outside IR35 calculation

        const earnings = this.state.totalFees - this.state.expenses;

        const revenue = this.handleRevenue(earnings);
        const salary = revenue[0];
        const corporationTax = revenue[1].toFixed(2);
        const netProfit = revenue[2].toFixed(2);

        const personalTax = this.handleOutsideIT(netProfit);
        const incomeTaxOutside = personalTax[0].toFixed(2);
        const paLost = personalTax[1];
        
        const combinedOutside = (personalTax[0] + revenue[1]).toFixed(2);

        const dividends = this.handleDividends(netProfit);
        const outsideFees = this.handleOutsideFees(salary, dividends, paLost);
        const outsideAnnual = outsideFees[0].toFixed(2);
        const outsideMonthly = outsideFees[1].toFixed(2);

        this.setState({
            // Inside IR35 variables
            incomeTax: incomeTax,
            nationalInsurance: nationalInsurance,
            combined: combined,
            insideAnnual: insideAnnual,
            insideMonthly: insideMonthly,
            // Outside IR35 variables
            earnings: earnings,
            salary: salary,
            corporationTax: corporationTax,
            netProfit: netProfit,
            dividends: dividends,
            incomeTaxOutside: incomeTaxOutside,
            outsideAnnual: outsideAnnual,
            outsideMonthly: outsideMonthly,
            combinedOutside: combinedOutside,
            paLost: paLost
        });
    }
    
    handleInsideTax = (totalFees) => {
        var incomeTax = 0;
        var nationalInsurance = 0;
        switch (true) {
            case (totalFees <= 12500):
                nationalInsurance = ((totalFees - 8632) * .12);
                break;
            case (totalFees <= 50000):
                incomeTax = ((totalFees - 12500) * .2);
                nationalInsurance = ((totalFees - 8632) * .12);
                break;
            case (totalFees <= 50024):
                incomeTax = (7500 + ((totalFees - 50000) * .4));
                nationalInsurance = ((totalFees - 8632) * .12);
                break;
            case (totalFees <= 150000):
                incomeTax = (7500 + ((totalFees - 50000) * .4));
                nationalInsurance = (4964.16 + ((totalFees - 50000) * .02));
                break;
            case (totalFees > 150000):
                incomeTax = (47500 + ((totalFees - 150000) * .45));
                nationalInsurance = (4964.16 + ((totalFees - 50000) * .02));
                break;
        }
        var combined = incomeTax + nationalInsurance;
        return [incomeTax, nationalInsurance, combined];
    }

    handleInsideFees = (totalFees, combined) => {
        var annual = totalFees - combined;
        var monthly = Math.round((annual / 12) * 100) / 100;
        return [annual, monthly];
    }

    handleRevenue = (earnings) => {
        var salary = 0;
        var corporationTax = 0;
        var netProfit = 0;
        if (earnings <= 8500) {
            salary = earnings;
        } else {
            salary = 8500;
            corporationTax = (earnings - 8500) * .19;
            netProfit = (earnings - 8500) - corporationTax;
        }
        return [salary, corporationTax, netProfit];
    }

    handleOutsideIT = (netProfit) => {
        var incomeTax = 0;
        switch (true) {
            case (netProfit <= 41500):
                incomeTax = (netProfit - 6000) * .075;
                break;
            case (netProfit <= 141500):
                incomeTax = ((netProfit - 41500) * .325) + 2662.50;
                break;
            case (netProfit > 141500):
                incomeTax = ((netProfit - 141500) * .381) + 35162.50;
                break;
        }
        // Stealth tax calculation for contractors earning £100,000+
        // £100,000 threshold composed of £91,500 profits and £8,500 salary
        var over100 = netProfit - 91500;
        var paLost = 0;
        if (over100 > 0 && over100 >= 25000) {
            // If threshold is met, paLost accounts for stealth tax
            // £1 of personal allowance lost for each £2 earned over £100,000 up to £125,000
            paLost = 25000 * .1625;
        } else if (over100 > 0 && over100 < 25000) {
            paLost = over100 * .1625;
        }
        incomeTax += paLost;
        return [incomeTax, paLost];
    }

    handleDividends = (netProfit) => {
        var dividends = 0;
        switch (true) {
            case (netProfit <= 6000):
                // 6000 accounts for 4000 remaining PA and 2000 DA combined
                dividends = netProfit;
                break;
            case (netProfit <= 41500):
                dividends = 6000 + ((netProfit - 6000) * .925);
                break;
            case (netProfit <= 141500):
                dividends = 6000 + 32837.50 + ((netProfit - 41500) * .675);
                break;
            case (netProfit > 141500):
                dividends = 6000 + 32837.50 + 67500 + ((netProfit - 141500) * .619);
                break;
        }
        return dividends;
    }

    handleOutsideFees = (salary, dividends, paLost) => {
        const annual = (salary + dividends) - paLost;
        const monthly = Math.round((annual / 12) * 100) / 100;
        return [annual, monthly];
    }
    
    render() {
        const buttonText = this.state.combined ? "Update Calculation" : "Calculate Tax";
        // Inside IR35 variables
        const {rate} = this.state
        const {totalFees} = this.state
        const {incomeTax} = this.state
        const {nationalInsurance} = this.state
        const {combined} = this.state
        const {insideAnnual} = this.state
        const {insideMonthly} = this.state
        // Outside IR35 variables
        const {expenses} = this.state
        const {earnings} = this.state
        const {corporationTax} = this.state
        const {outsideAnnual} = this.state
        const {outsideMonthly} = this.state
        const {incomeTaxOutside} = this.state
        const {combinedOutside} = this.state
        
        return (
            <div className="calculator">
              <div className="calc-div" id="left-top">
                <form onSubmit={this.handleSubmit}>
                    <p>My daily contract rate is £ <input type="text" name="rate" onChange={this.handleInputChange}></input></p>
                    <p>My annual expenses amount to £ <input type="text" name="expenses" onChange={this.handleInputChange}></input></p>
                    <button type="submit">{buttonText}</button>
                </form>
                <p>The following calculations are based on your daily contract rate of <p className={ this.state.rate ? "green" : "white" }>£{rate}</p>, estimating that you work 44 weeks 
                per year, generating gross annual contracting fees of <p className={ this.state.totalFees ? "green" : "white" }>£{totalFees}</p>, while claiming expenses amounting to <p className={ this.state.expenses ? "green" : "white" }>£{expenses}</p>.</p>
              </div>
              <div className="calc-div" id="right">
                <h2>Comparison</h2>
                <table>
                    <tr>
                        <th class="col1"></th>
                        <th class="col23"><p>Inside IR35</p></th>
                        <th class="col23"><p>Outside IR35</p></th>
                    </tr>
                    <tr>
                        <td class="col1"><p>Total tax liability</p></td>
                        <td className={ this.state.combined <= this.state.combinedOutside ? "greenBox" : "redBox" }><p className="white">£{combined}</p></td>
                        <td className={ this.state.combinedOutside <= this.state.combined ? "greenBox" : "redBox" }><p className="white">£{combinedOutside}</p></td>
                    </tr>
                    <tr>
                        <td class="col1"><p>Annual post-tax income</p></td>
                        <td className={ this.state.insideAnnual >= this.state.outsideAnnual ? "greenBox" : "redBox" }><p className="white">£{insideAnnual}</p></td>
                        <td className={ this.state.outsideAnnual >= this.state.insideAnnual ? "greenBox" : "redBox" }><p className="white">£{outsideAnnual}</p></td>
                    </tr>
                    <tr>
                        <td class="col1"><p>Monthly post-tax income</p></td>
                        <td className={ this.state.insideMonthly >= this.state.outsideMonthly ? "greenBox" : "redBox" }><p className="white">£{insideMonthly}</p></td>
                        <td className={ this.state.outsideMonthly >= this.state.insideMonthly ? "greenBox" : "redBox" }><p className="white">£{outsideMonthly}</p></td>
                    </tr>
                </table>
              </div>
              <div className="calc-div" id="left">
                <h2>Inside IR35</h2>
                <ul>
                    <li>Your gross earnings are <p className={ this.state.totalFees ? "green" : "white" }>£{totalFees}</p>.</li>
                    <li>Your income tax liability is <p className={ this.state.incomeTax ? "red" : "white" }>£{incomeTax}</p>.</li>
                    <li>Your National Insurance liability is <p className={ this.state.nationalInsurance ? "red" : "white" }>£{nationalInsurance}</p>.</li>
                    <li>Your overall combined tax liability is <p className={ this.state.combined ? "red" : "white" }>£{combined}</p>.</li>
                    <li>Working 'inside IR35', your annual post-tax income amounts to <p className={ this.state.insideAnnual ? "green" : "white" }>£{insideAnnual}</p>.</li>
                    <li>This amounts to <p className={ this.state.insideMonthly ? "green" : "white" }>£{insideMonthly}</p> per month.</li>
                </ul>
              </div>
              <div className="calc-div" id="right">
                <h2>Outside IR35</h2>
                <ul>
                    <li>After expenses of <p className={ this.state.expenses ? "green" : "white" }>£{expenses}</p>, your gross earnings are <p className={ this.state.rate ? "green" : "white" }>£{earnings}</p>.</li>
                    <li>Your Corporation Tax liability is <p className={ this.state.corporationTax ? "red" : "white" }>£{corporationTax}</p>.</li>
                    <li>The income tax due on your dividends is <p className={ this.state.incomeTaxOutside ? "red" : "white" }>£{incomeTaxOutside}</p>.</li>
                    <li>Your overall combined tax liability is <p className={ this.state.combinedOutside ? "red" : "white" }>£{combinedOutside}</p>.</li>
                    <li>Working 'outside IR35', your annual post-tax income amounts to <p className={ this.state.outsideAnnual ? "green" : "white" }>£{outsideAnnual}</p>.</li>
                    <li>This amounts to <p className={ this.state.outsideMonthly ? "green" : "white" }>£{outsideMonthly}</p> per month.</li>
                </ul>
              </div>
              <p>Please note: These calculations are accurate as of the 2019-20 tax year.</p>
            </div>
        );
    }
}

export default Calculator;