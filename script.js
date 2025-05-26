// Konfigurasi
const PASSWORD = "123";
const WAKTU_UJIAN = 30; // dalam menit, bisa diubah

// Variabel global
let userData = {};
let soalData = [];
let jawabanUser = [];

// Fungsi untuk memuat soal dari file
async function muatSoal() {
    try {
        const response = await fetch('soal.txt');
        const text = await response.text();
        return parseSoal(text);
    } catch (error) {
        console.error('Gagal memuat soal:', error);
        return [];
    }
}

// Fungsi untuk parsing soal dari text
function parseSoal(text) {
    const soalArray = text.split('\n\n').filter(soal => soal.trim() !== '');
    return soalArray.map(soalText => {
        const lines = soalText.split('\n').filter(line => line.trim() !== '');
        
        const nomorSoal = lines[0].split('. ')[0];
        const pertanyaan = lines[0].split('. ')[1];
        
        const opsi = {};
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].startsWith('a. ')) opsi.a = lines[i].substring(3);
            else if (lines[i].startsWith('b. ')) opsi.b = lines[i].substring(3);
            else if (lines[i].startsWith('c. ')) opsi.c = lines[i].substring(3);
            else if (lines[i].startsWith('d. ')) opsi.d = lines[i].substring(3);
            else if (lines[i].startsWith('Kunci: ')) opsi.kunci = lines[i].substring(7).trim();
            else if (lines[i].startsWith('Gambar:')) {
                const gambar = lines[i].substring(7).trim();
                opsi.gambar = gambar !== '' ? gambar : null;
            }
        }
        
        return {
            nomor: nomorSoal,
            pertanyaan: pertanyaan,
            opsi: opsi,
            kunci: opsi.kunci,
            gambar: opsi.gambar || null
        };
    });
}

// Fungsi untuk memulai timer
function mulaiTimer(durasiMenit, display) {
    let timer = durasiMenit * 60;
    const interval = setInterval(function () {
        const menit = Math.floor(timer / 60);
        let detik = timer % 60;
        
        detik = detik < 10 ? "0" + detik : detik;
        
        display.textContent = menit + ":" + detik;
        
        if (--timer < 0) {
            clearInterval(interval);
            selesaiKuis();
        }
    }, 1000);
}

// Fungsi untuk menampilkan soal
function tampilkanSoal(soalData) {
    const container = document.getElementById('soalContainer');
    container.innerHTML = '';
    
    soalData.forEach((soal, index) => {
        const soalElement = document.createElement('div');
        soalElement.className = 'soal';
        soalElement.innerHTML = `
            <h3>${soal.nomor}. ${soal.pertanyaan}</h3>
            ${soal.gambar ? `<img src="gambar/${soal.gambar}" alt="Gambar soal">` : ''}
            <div class="opsi">
                <input type="radio" name="soal${index}" id="soal${index}a" value="a">
                <label for="soal${index}a">a. ${soal.opsi.a}</label>
            </div>
            <div class="opsi">
                <input type="radio" name="soal${index}" id="soal${index}b" value="b">
                <label for="soal${index}b">b. ${soal.opsi.b}</label>
            </div>
            <div class="opsi">
                <input type="radio" name="soal${index}" id="soal${index}c" value="c">
                <label for="soal${index}c">c. ${soal.opsi.c}</label>
            </div>
            <div class="opsi">
                <input type="radio" name="soal${index}" id="soal${index}d" value="d">
                <label for="soal${index}d">d. ${soal.opsi.d}</label>
            </div>
        `;
        container.appendChild(soalElement);
    });
}

// Fungsi untuk menghitung skor
function hitungSkor() {
    let skor = 0;
    const totalSoal = soalData.length;
    
    for (let i = 0; i < totalSoal; i++) {
        const selectedOption = document.querySelector(`input[name="soal${i}"]:checked`);
        if (selectedOption && selectedOption.value === soalData[i].kunci) {
            skor++;
        }
    }
    
    return skor;
}

// Fungsi ketika kuis selesai
function selesaiKuis() {
    const skor = hitungSkor();
    
    // Simpan data ke Google Spreadsheet (menggunakan Apps Script)
    simpanKeSpreadsheet(userData.nama, userData.kelas, skor);
    
    // Simpan data di localStorage untuk halaman hasil
    localStorage.setItem('hasilKuis', JSON.stringify({
        nama: userData.nama,
        kelas: userData.kelas,
        skor: skor
    }));
    
    // Redirect ke halaman hasil
    window.location.href = 'hasil.html';
}

// Fungsi untuk menyimpan data ke Google Spreadsheet
function simpanKeSpreadsheet(nama, kelas, skor) {
    // URL Web Apps dari Google Apps Script
    const scriptUrl = 'URL_APPS_SCRIPT_ANDA';
    
    fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            nama: nama,
            kelas: kelas,
            skor: skor,
            timestamp: new Date().toISOString()
        })
    }).catch(error => console.error('Error:', error));
}

// Event ketika DOM sudah dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Halaman login
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nama = document.getElementById('nama').value;
            const kelas = document.getElementById('kelas').value;
            const password = document.getElementById('password').value;
            
            if (password === PASSWORD) {
                userData = { nama, kelas };
                localStorage.setItem('userData', JSON.stringify(userData));
                window.location.href = 'kuis.html';
            } else {
                alert('Password salah!');
            }
        });
    }
    
    // Halaman kuis
    if (document.getElementById('soalContainer')) {
        const displayNama = document.getElementById('displayNama');
        const displayKelas = document.getElementById('displayKelas');
        const timerDisplay = document.getElementById('timer');
        const submitBtn = document.getElementById('submitBtn');
        
        // Ambil data user
        userData = JSON.parse(localStorage.getItem('userData'));
        displayNama.textContent = userData.nama;
        displayKelas.textContent = userData.kelas;
        
        // Muat soal dan tampilkan
        muatSoal().then(soal => {
            soalData = soal;
            tampilkanSoal(soal);
        });
        
        // Mulai timer
        mulaiTimer(WAKTU_UJIAN, timerDisplay);
        
        // Event tombol selesai
        submitBtn.addEventListener('click', selesaiKuis);
    }
    
    // Halaman hasil
    if (document.getElementById('hasilNama')) {
        const hasil = JSON.parse(localStorage.getItem('hasilKuis'));
        document.getElementById('hasilNama').textContent = hasil.nama;
        document.getElementById('hasilKelas').textContent = hasil.kelas;
        document.getElementById('skor').textContent = `${hasil.skor}`;
    }
});
