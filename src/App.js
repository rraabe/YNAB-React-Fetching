import React from "react";
import logo, { ReactComponent } from "./logo.svg";
import "./App.css";
import * as ynab from "ynab";

//Add your API access token between the quotation marks
const accessToken = "";
const ynabAPI = new ynab.API(accessToken);

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      date: new Date(),
      budget: '',
    };
  }

async budget() {
  const budgetsResponse = await ynabAPI.budgets.getBudgets();
  console.log('The budgetsResponse is: ', budgetsResponse);
};

async budgetID() {
  const budgetsResponse = await ynabAPI.budgets.getBudgets();
  const budgetId = budgetsResponse.data.budgets[0].id
  console.log('The budgetId is: ', budgetId);
  
};
async budgetbyID() {
  const budgetsResponse = await ynabAPI.budgets.getBudgets();
  const budgetId = budgetsResponse.data.budgets[0].id
  const budgetById = await ynabAPI.budgets.getBudgetById(budgetId)
  console.log('budgetById is: ', budgetById)
 
};
async budgets() {
  const budgetsResponse = await ynabAPI.budgets.getBudgets();
  const budgets = budgetsResponse.data.budgets;
  console.log('budgetsResponse.data.budgets is: ', budgets)

};

  render() {
    return (
      <div className="App">
     <button onClick={this.budget}>budgetsResponse</button>
     <button onClick={this.budgetID}>BudgetId</button>
     <button onClick={this.budgetbyID}>budgetbyID</button>
     <button onClick={this.budgets}>budgets</button>

      </div>
    );
  }
}

export default App;
