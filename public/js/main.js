
const submit = async function (event) {
    event.preventDefault();

    const user = localStorage.getItem("currentUser");
    if (!user) {
        alert("You must be logged in!");
        return;
    }

    const input = document.querySelector("#yourname"),
        amount = document.querySelector("#amount"),
        category = document.querySelector("#category"),
        date = document.querySelector("#date"),
        json = {
            username: user,
            yourname: input.value,
            amount: amount.value,
            category: category.value,
            date: date.value,
        },
        body = JSON.stringify(json);

    const response = await fetch("/addTransaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body
    });

    if (response.ok) {
        alert('Transaction added!');
        await fetchData();
    } else {
        alert("Error adding transaction.");
    }

    input.value = "";
    amount.value = "";
    category.value = "";
    date.value = "";
};


async function fetchData() {
    const user = localStorage.getItem("currentUser");
    if (!user) return;

    const response = await fetch(`/results?username=${user}`);
    const data = await response.json();
    updateTable(data);
}


function updateTable(data) {
    const tableBody = document.querySelector("#resultsTable tbody");
    tableBody.innerHTML = ""; // Clear table

    data.forEach(entry => {
        var newRow = tableBody.insertRow();

        var cell1 = newRow.insertCell(0);
        var cell2 = newRow.insertCell(1);
        var cell3 = newRow.insertCell(2);
        var cell4 = newRow.insertCell(3);
        var cell5 = newRow.insertCell(4); // Edit button
        var cell6 = newRow.insertCell(5); // Delete button

        cell1.textContent = entry.yourname;
        cell2.textContent = entry.amount;
        cell3.textContent = entry.category;
        cell4.textContent = formatDate(entry.date);

        // Edit button
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.classList.add("editButton");
        editButton.onclick = function () {
            editTransaction(entry._id);
        };
        cell5.appendChild(editButton);

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("deleteButton");
        deleteButton.onclick = function () {
            deleteTransaction(entry._id);
        };
        cell6.appendChild(deleteButton);
    });
}

function formatDate(dateString){
    const date = new Date(dateString);

    const month = date.getMonth() + 1;
    const day = date.getDate() + 1;
    const year = date.getFullYear();

    // Format as MM/DD/YYYY
    return `${month}/${day}/${year}`;
}

async function editTransaction(transactionId) {
    const newAmount = prompt("Enter new amount: ");
    if (newAmount && !isNaN(newAmount)) {
        try {
            const response = await fetch(`/editTransaction/${transactionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: newAmount })
            });

            if (response.ok) {
                const data = await response.json();
                updateTable(data.updatedTransaction);
                alert("Transaction updated!");
            } else {
                console.error("Failed to update transaction");
            }
        } catch (error) {
            console.error("Error editing transaction:", error);
        }
    } else {
        alert("Please enter a valid amount.");
    }
}


// Delete transaction
async function deleteTransaction(transactionId) {
    try {
        const response = await fetch(`/deleteTransaction/${transactionId}`, {
            method: "DELETE"
        });

        console.log("Delete response status:", response.status);  // Log response status

        if (response.ok) {
            alert('Transaction deleted!');
            await fetchData();
        } else {
            console.error(`Failed to delete transaction. Status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting transaction: ', error);
    }
}


const clearTable = async function() {
    try {
        const response = await fetch("/clear", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });

        // Log the response from the server
        console.log('Response:', response);

        if (response.ok) {
            const text = await response.json();
            console.log(text.message);

            await fetchData();
        } else {
            console.error('Failed to clear data:', response.statusText);
        }
    } catch (error) {
        console.error('Error clearing table:', error);
    }
};

document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.getElementById("loginButton");
    // const registerButton = document.getElementById("registerButton");
    const logoutButton = document.getElementById("logoutButton");

    const currentUser = localStorage.getItem("currentUser");

    if(currentUser) {
        loginButton.style.display = "none"; // Hide login button
        //     registerButton.style.display = "none";  // Hide register button
        logoutButton.style.display = "inline";  // Show logout button
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    if (loginButton) {
        loginButton.addEventListener("click", login);
    }

    // if (registerButton) {
    //     registerButton.addEventListener("click", register);
    // }
});


async function login() {
    const username = document.querySelector("#username").value;
    const password = document.querySelector("#password").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        localStorage.setItem("currentUser", username);  // Store username
        alert("Login successful!");
        window.location.href = "index.html";  // Redirect
    } else {
        alert("Login failed!");
    }
}

async function logout() {
    localStorage.removeItem("currentUser");
    alert("Logout successful!");
    window.location.href = "login.html";
}

window.onload = function () {
    let addTransactionButton = document.querySelector("#addTransactionButton");
    let clearButton = document.querySelector("#clearButton");

    if (addTransactionButton) {
        addTransactionButton.onclick = submit;
    }

    if (clearButton) {
        clearButton.onclick = clearTable;
    }
};

