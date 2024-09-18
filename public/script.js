document.addEventListener('DOMContentLoaded', () => {
    const issueBookForm = document.getElementById('issueBookForm');
    const issuedBooksTable = document.getElementById('issuedBooksTable').querySelector('tbody');
    const returnedBooksTable = document.getElementById('returnedBooksTable').querySelector('tbody');
    const payFineModal = document.getElementById('payFineModal');
    const fineAmountDisplay = document.getElementById('fineAmount');
    let currentFine = 0;
    let bookIdToReturn = null;

    // Helper function to calculate fine based on issued time
    const calculateFine = (issuedAt) => {
        const currentTime = new Date();
        const issuedTime = new Date(issuedAt);
        const timeDiff = (currentTime - issuedTime) / (1000 * 60); // Time difference in minutes

        let fine = 0;
        if (timeDiff > 2) {
            fine = Math.floor((timeDiff) / 2) * 10; // Fine of 10 INR for every 2 minutes after 2 minutes
        }
        return fine;
    };

    // Fetch and display all issued books with real-time fine calculation
    const fetchIssuedBooks = async () => {
        const res = await fetch('/api/books/issued');
        const books = await res.json();
        issuedBooksTable.innerHTML = '';
        books.forEach(book => {
            const fine = calculateFine(book.issuedAt);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${book.name}</td>
                <td>${new Date(book.issuedAt).toLocaleString()}</td>
                <td>${new Date(new Date(book.issuedAt).getTime() + 2 * 60000).toLocaleString()}</td>
                <td>${fine > 0 ? fine + ' INR' : 'No fine'}</td>
                <td><button onclick="returnBook(${book.id})">Return</button></td>
            `;
            issuedBooksTable.appendChild(tr);
        });
    };

    // Fetch and display all returned books
    const fetchReturnedBooks = async () => {
        const res = await fetch('/api/books/returned');
        const books = await res.json();
        returnedBooksTable.innerHTML = '';
        books.forEach(book => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${book.name}</td>
                <td>${new Date(book.issuedAt).toLocaleString()}</td>
                <td>${new Date(book.returnedAt).toLocaleString()}</td>
                <td>${book.finePaid} INR</td>
            `;
            returnedBooksTable.appendChild(tr);
        });
    };

    // Handle book issue form submission
    issueBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bookName = document.getElementById('bookName').value;

        const res = await fetch('/api/books/issue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: bookName })
        });

        if (res.ok) {
            issueBookForm.reset();
            fetchIssuedBooks();
        } else {
            alert('Error issuing book');
        }
    });

    // Handle book return
    window.returnBook = async (id) => {
        const res = await fetch(`/api/books/return/${id}`, { method: 'PUT' });
        const book = await res.json();

        const fine = calculateFine(book.issuedAt);
        if (fine > 0 && book.finePaid === 0) {
            // Show modal if fine is unpaid
            fineAmountDisplay.textContent = `Fine amount: ${fine} INR`;
            payFineModal.style.display = 'block';
            currentFine = fine;
            bookIdToReturn = id;
        } else {
            // Proceed if no fine or already paid
            await completeReturn(id);
            fetchIssuedBooks();
            fetchReturnedBooks();
        }
    };

    // Complete the return process only after fine payment or if no fine
    const completeReturn = async (id) => {
        await fetch(`/api/books/complete-return/${id}`, { method: 'PUT' });
    };

    // Handle fine payment
    document.getElementById('payFineButton').addEventListener('click', async () => {
        if (bookIdToReturn !== null) {
            await fetch(`/api/books/pay-fine/${bookIdToReturn}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ finePaid: currentFine })
            });

            await completeReturn(bookIdToReturn);

            // Hide the modal and reset the state
            payFineModal.style.display = 'none';
            bookIdToReturn = null;
            currentFine = 0;

            // Refresh the books list
            fetchIssuedBooks();
            fetchReturnedBooks();
        }
    });

    // Close the fine payment modal
    document.querySelector('.close').addEventListener('click', () => {
        payFineModal.style.display = 'none';
    });

    // Initial fetch for issued and returned books
    fetchIssuedBooks();
    fetchReturnedBooks();

    // Polling to refresh issued books table every minute to check fine updates
    setInterval(fetchIssuedBooks, 60000);
});

// //Utility function for Local Storage
// const getLocalStorage = (key) => JSON.parse(localStorage.getItem(key)) || [];
// const setLocalStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// //Function to issue a new book
// const issueBook = (bookName) =>{
//     if(!bookName) return alert("Book name is required!");
//     const issuedAt = new Date().toISOString();
//     const books = getLocalStorage('issuedBooks');
//     books.push({ name: bookName, issuedAt, finePaid: 0 });
//     setLocalStorage('issuedBooks', books);
//     displayIssuedBooks();
// };

// //function to calculate the return time
// const calculateReturnTime = (issuedAt) => {
//     const issuedTime = new Date(issuedAt);
//     issuedTime.setMinutes(issuedTime.getMinutes() +2);
//     return issuedTime.toLocaleString();
// };

// //function to calculate fine
// const calculateFine = (issuedAt, returnedAt) => {
//     const issuedTime = new Date(issuedAt);
//     const returnedTime = new Date(returnedAt);
//     const timeDiff = (returnedTime - issuedTime)/(1000 * 60);
//     if(timeDiff > 2){
//         return Math.floor((timeDiff)/2)*10;
//     }
//     return 0;
// };

// //Function to display all issued books
// const displayIssuedBooks = () =>{
//     const books = getLocalStorage('issuedBooks');
//     const tbody = document.querySelector('#issuedBooksTable tbody');
//     if (!tbody) return;
//     let rows = '';

//     books.forEach ((book, index) => {
//         const returnTime = calculateReturnTime(book.issuedAt);
//         const fine = calculateFine(book.issuedAt, new Date().toISOString());
//         rows += `
//             <tr>
//                 <td>${book.name}</td>
//                 <td>${new Date(book.issuedAt).toLocaleString()}</td>
//                 <td>${returnTime}</td>
//                 <td>${fine}</td>
//                 <td>$<button onclick="returnBook(${index})">Return</button></td>
//             </tr>
//         `;
//     });
//     tbody.innerHTML = rows;
// };

// //function to return a book
// const returnBook = (index) => {
//     const issuedBooks = getLocalStorage('issuedBooks');
//     const book = issuedBooks[index];
//     const returnedAt = new Date().toISOString();
//     const fine = calculateFine(book.issuedAt, returnedAt);

//     if(fine > 0 && book.finePaid === 0) {
//         document.querySelector('#fineAmount').textContent = `Fine amount: ${fine}`;
//         document.querySelector('#payFineModal').style.display = 'block';
//         document.querySelector('#payFineButton').onclick = () => payFine(index, fine);
//     }else{
//         completeReturnProcess(index, returnedAt, fine);
//     }
// };

// //function to complete the return process
// const completeReturnProcess = (index, returnedAt, fine) => {
//     const issuedBooks = getLocalStorage('issuedBooks');
//     const book = issuedBooks[index];
//     book.returnedAt = returnedAt;
//     book.finePaid = fine;

//     const returnedBooks = getLocalStorage('returnedBooks');
//     returnedBooks.push(book);
//     setLocalStorage('returnedBooks', returnedBooks);

//     issuedBooks.splice(index,1);
//     setLocalStorage('issuedBooks', issuedBooks);

//     displayIssuedBooks();
//     displayReturnedBooks();
// };

// //function to display all the returned books
// const displayReturnedBooks = ( ) => {
//     const books = getLocalStorage('returnedBooks');
//     const tbody = document.querySelector('#returnedBooksTable tbody');
//     if(!tbody) return;
//     let rows = '';

//     books.forEach((book) => {
//         rows += `
//             <tr>
//                 <td>${book.name}</td>
//                 <td>${new Date(book.issuedAt).toLocaleString()}</td>
//                 <td>${new Date(book.returnedAt).toLocaleString()}</td>
//                 <td>${book.finePaid}</td>
//             </tr>
//         `;
//     });
//     tbody.innerHTML = rows;
// };

// //function to pay the fine
// const payFine = (index, fine) => {
//     const issuedBooks = getLocalStorage('issuedBooks');
//     issuedBooks[index].finePaid = fine;
//     setLocalStorage('issuedBooks', issuedBooks);

//     document.querySelector('#payFineModal').style.display = 'none';
//     returnBook(index);
// };

// const closeModal = () => {
//     document.querySelector('#payFineModal').style.display = 'none';
// };

// document.addEventListener('DOMContentLoaded', () => {
//     const closeModalButton = document.querySelector('.close');
//     if(closeModalButton){
//         closeModalButton.onclick = closeModal;
//     }

//     //on page load, display the issued 
//     displayIssuedBooks();
//     displayReturnedBooks();

//     document.querySelector('#issueBookForm').addEventListener('submit', (e) => {
//         e.preventDefault();
//         const bookName = document.querySelector('#bookName').value.trim();
//         issueBook(bookName);
//         document.querySelector('#bookName').value = '';
//     });
// });