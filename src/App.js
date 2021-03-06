import React from "react";
import "./App.css";
import config from "./config.json";
import * as ynab from "ynab";
import { utils } from "ynab";
import { https } from "https";
// var util = require('util');
//Add your API access token between the quotation marks

function findYNABToken() {
  let token = null;
  const search = window.location.hash
    .substring(1)
    .replace(/&/g, '","')
    .replace(/=/g, '":"');
  if (search && search !== "") {
    // Try to get access_token from the hash returned by OAuth
    const params = JSON.parse('{"' + search + '"}', function(key, value) {
      return key === "" ? value : decodeURIComponent(value);
    });
    token = params.access_token;
    sessionStorage.setItem("ynab_access_token", token);
    window.location.hash = "";
  } else {
    // Otherwise try sessionStorage
    token = sessionStorage.getItem("ynab_access_token");
  }
  return token;
}

const accessToken = findYNABToken();
console.log(accessToken);
const ynabAPI = new ynab.API(accessToken);

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      date: new Date(),
      budget: "",
      categoryInput: "",
      budgetId: "",
      allCategories: "",
      balance: "",
      ynab: {
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        token: null,
        api: null
      },
      loading: false,
      error: null,
      //budgetId: null,
      budgets: [],
      transactions: [],
      accountList: ""
    };
    this.onChange = this.onChange.bind(this);
    this.budgetID = this.budgetID.bind(this);
    this.getAllCategories = this.getAllCategories.bind(this);
  }

  async budget() {
    const budgetsResponse = await ynabAPI.budgets.getBudgets();
    console.log("The budgetsResponse is: ", budgetsResponse);
  }

  async budgetID() {
    const budgetsResponse = await ynabAPI.budgets.getBudgets();
    const budgetId = budgetsResponse.data.budgets[0].id;
    console.log("The budgetId is: ", budgetId);
    this.setState({
      budgetId: budgetId
    });
  }

  async budgetbyID() {
    const budgetsResponse = await ynabAPI.budgets.getBudgets();
    const budgetId = budgetsResponse.data.budgets[0].id;
    const budgetById = await ynabAPI.budgets.getBudgetById(budgetId);
    console.log("budgetById is: ", budgetById);
  }

  async budgets() {
    const budgetsResponse = await ynabAPI.budgets.getBudgets();
    const budgets = budgetsResponse.data.budgets;
    console.log("budgetsResponse.data.budgets is: ", budgets);
  }

  async getAllCategories() {
    const budgetsResponse = await ynabAPI.budgets.getBudgets();
    const budgetId = budgetsResponse.data.budgets[0].id;
    const allCategories = await ynabAPI.categories.getCategories(budgetId);
    console.log("allCategories is: ", allCategories);
    this.setState({
      allCategories: allCategories
    });
  }

  async getOneCategories() {
    const budgetsResponse = await ynabAPI.budgets.getBudgets();
    const budgetId = budgetsResponse.data.budgets[0].id;
    const oneCategory = await ynabAPI.categories.getCategoryById(
      budgetId,
      "19d54452-7055-4b33-8b07-a8eeb0d19453"
    );
    console.log("oneCategories is: ", oneCategory);
  }

  async getAllAccounts() {
    const budgetsResponse = await ynabAPI.budgets.getBudgets();
    const budgetId = budgetsResponse.data.budgets[0].id;
    const accountList = await ynabAPI.accounts.getAccounts(budgetId);
    const payees = await ynabAPI.payees.getPayees(budgetId);
    console.log("accountList is: ", accountList);
    console.log(accountList.data.accounts[0].id);
    console.log('Payees are: ', payees);
  }

  async createTransaction() {
    const budgetsResponse = await ynabAPI.budgets.getBudgets();
    const budgetId = budgetsResponse.data.budgets[0].id;
    const accountList = await ynabAPI.accounts.getAccounts(budgetId);
    const account_id = accountList.data.accounts[0].id;
    const data = {
      "transaction": {
        "account_id": account_id,
        "date": '2019-08-18',
        "amount": 100,
        "payee_name": "payee_name string",
        "category_id": "eaf4fafe-886e-4ec4-a51a-ab63d4e9aadd",
        "memo": "memo string",
      
      }  
    };

    await ynabAPI.transactions.createTransaction(budgetId, data);
  }

  onChange(event) {
    // console.log('The event.target.value is: ', event.target.value)
    this.setState({
      categoryInput: event.target.value
    });
  }
  //I think I need a for each loop to look through the category_groups with a nested for loop looking for
  // data.category_groups[2].categories[6].name

  async findCategory() {
    const budgetsResponse = await ynabAPI.budgets.getBudgets();
    const budgetId = budgetsResponse.data.budgets[0].id;
    const allCategories = await ynabAPI.categories.getCategories(budgetId);
    console.log("State: ", this.state.categoryInput);

    for (let categoryGroup of allCategories.data.category_groups) {
      if (
        categoryGroup.categories.find(
          category => category.name === this.state.categoryInput
        )
      ) {
        let yourCategory = categoryGroup.categories.find(
          category => category.name === this.state.categoryInput
        );
        console.log("yourCategory balance is: ", yourCategory.balance);
        this.setState({
          balance: yourCategory.balance
        });
      }
    }
  }
  // This builds a URI to get an access token from YNAB
  // https://api.youneedabudget.com/#outh-applications
  authorizeWithYNAB(e) {
    // e.preventDefault();
    const uri = `https://app.youneedabudget.com/oauth/authorize?client_id=${
      this.state.ynab.clientId
    }&redirect_uri=${this.state.ynab.redirectUri}&response_type=token`;
    window.location.replace(uri);
  }

  async budgetMonth() {
    const budgetMonthRequest = ynabAPI.months.getBudgetMonth(
      "default",
      "current"
    );
    budgetMonthRequest.then(r => {
      console.log(r);
      const categories = r.data.month.categories;
      const balances = categories.map(c => {
        return {
          name: c.name,
          // we need to convert the milliunits balance to a currency amount first
          balance: ynab.utils
            .convertMilliUnitsToCurrencyAmount(c.balance, 2)
            .toFixed(2),
          budgeted: ynab.utils
            .convertMilliUnitsToCurrencyAmount(c.budgeted, 2)
            .toFixed(2), 
          id: c.id
        };
      });
      console.log(balances);
    });
  }

  //Add a form input field that saves to state
  //Click a button that grabs all the categories then finds the category typed into the field
  //Return the balance of that category

  render() {
    return (
      <div className="App">
        <button onClick={this.budget}>budgetsResponse</button>
        <button onClick={this.budgetbyID}>budgetbyID</button>
        <button onClick={this.budgets}>budgets</button>
        <button onClick={this.getAllCategories}>allCategories</button>
        <button onClick={this.getOneCategories}>oneCategories</button>
        <button onClick={this.budgetID}>BudgetId</button>
        <button onClick={this.budgetMonth}>budgetMonth</button>
        <button onClick={this.getAllAccounts}>getAllAccounts</button>
        <button onClick={this.createTransaction}>createTransaction</button>
        <br />
        <span>
          Hey Google, what's my{" "}
          <form>
            <input
              type="text"
              name="category"
              value={this.state.category}
              onChange={this.onChange}
            />
          </form>
          budget?
        </span>
        <br />
        <button onClick={() => this.findCategory()}>Balance of Input</button>
        <p>
          $
          {utils
            .convertMilliUnitsToCurrencyAmount(this.state.balance)
            .toFixed(2)}
        </p>
        <hr />
        <button
          onClick={() => this.authorizeWithYNAB()}
          className="btn btn-primary"
        >
          Authorize This App With YNAB &gt;
        </button>
      </div>
    );
  }
}

export default App;
