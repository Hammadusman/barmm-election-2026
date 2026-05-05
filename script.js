let chart;

// =======================
// SAVE DATA
// =======================
function saveData() {
    const rows = document.querySelectorAll(".party-row");
    let data = [];

    rows.forEach(row => {
        data.push({
            name: row.children[0].value,
            votes: row.children[1].value
        });
    });

    localStorage.setItem("barmm_parties", JSON.stringify(data));
}

// =======================
// LOAD DATA
// =======================
function loadData() {
    const saved = localStorage.getItem("barmm_parties");
    if (!saved) return;

    const data = JSON.parse(saved);

    data.forEach(p => {
        addParty(p.name, p.votes);
    });
}

// =======================
// ADD PARTY
// =======================
function addParty(name = "", votes = "") {
    const div = document.createElement("div");
    div.className = "party-row";

    div.innerHTML = `
        <input type="text" placeholder="Party Name" value="${name}">
        <input type="number" placeholder="Votes" value="${votes}">
        <button class="btn-danger" onclick="removeParty(this)">✕</button>
    `;

    const nameInput = div.children[0];
    const voteInput = div.children[1];

    // 🔥 REALTIME UPDATE FOR VOTES
    voteInput.addEventListener("input", () => {
        saveData();
        updateSummary();
    });

    // save name changes too
    nameInput.addEventListener("input", saveData);

    document.getElementById("partyContainer").appendChild(div);

    updateSummary();
}

// =======================
// REMOVE PARTY
// =======================
function removeParty(btn) {
    btn.parentElement.remove();
    saveData();
    updateSummary();
}

// =======================
// TOTAL VOTES
// =======================
function getTotalVotesEntered() {
    let total = 0;

    document.querySelectorAll("#partyContainer input[type='number']")
        .forEach(i => total += Number(i.value) || 0);

    return total;
}

// =======================
// 🔥 REALTIME SUMMARY
// =======================
function updateSummary() {
    const totalVotes = getTotalVotesEntered();
    const parties = document.querySelectorAll(".party-row").length;

    document.getElementById("totalParties").innerText = parties;
    document.getElementById("totalVoters").innerText = totalVotes;
}

// =======================
// CALCULATE SEATS
// =======================
function calculateSeats() {
    let parties = [];
    const totalVoters = getTotalVotesEntered();

    if (totalVoters === 0) return alert("Enter votes first!");

    document.querySelectorAll(".party-row").forEach((row, i) => {
        let name = row.children[0].value || `Party ${i+1}`;
        let votes = Number(row.children[1].value);

        if (!votes) return;

        let percentage = Math.floor((votes / totalVoters) * 100);
        let seats = Math.floor((percentage * 40) / 100);

        parties.push({ name, votes, percentage, seats });
    });

    let allocated = parties.reduce((s,p)=>s+p.seats,0);
    let remaining = 40 - allocated;

    parties.sort((a,b)=>b.votes-a.votes);

    let i = 0;
    while (remaining > 0 && parties.length > 0) {
        parties[i].seats++;
        remaining--;
        i = (i + 1) % parties.length;
    }

    displayResults(parties);
    drawGraph(parties);

    saveData();
}

// =======================
// DISPLAY RESULTS
// =======================
function displayResults(parties) {
    const tbody = document.getElementById("resultsBody");
    tbody.innerHTML = "";

    parties.forEach((p,i)=>{
        tbody.innerHTML += `
        <tr>
            <td>${i+1}</td>
            <td>${p.name}</td>
            <td>${p.votes}</td>
            <td>${p.percentage}%</td>
            <td>${p.seats}</td>
        </tr>`;
    });
}

// =======================
// GRAPH
// =======================
function drawGraph(parties){
    const labels = parties.map(p => p.name);
    const votes = parties.map(p => p.votes);
    const seats = parties.map(p => p.seats);

    const colors = labels.map((_, i) =>
        `hsl(${i * 360 / labels.length}, 70%, 60%)`
    );

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("chart"), {
        type: "bar",
        data: {
            labels, // 👉 bottom (x-axis = parties)
           datasets: [{
                label: "Total Votes", // 👉 side label meaning
                data: votes,
                backgroundColor: colors
            }]

        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: "top"
                },
                tooltip: {
                    callbacks: {
                        label: (c) => {
                            let i = c.dataIndex;
                            return [
                                `Votes: ${votes[i]}`,
                                `Seats: ${seats[i]}`,
                                `Rank: ${i + 1}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Political Parties" // 👉 bottom label
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: "Total Votes" // 👉 side label
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// =======================
// INIT
// =======================
window.onload = () => {
    loadData();

    if (document.querySelectorAll(".party-row").length === 0) {
        addParty();
    }

    updateSummary();
};