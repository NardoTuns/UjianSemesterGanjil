// Konfigurasi
const PASSWORD = "123";
const WAKTU_UJIAN = 30; // menit

// Variabel global
let userData = {};
let soalData = [];

// Fungsi memuat soal dari file
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

// Parsing soal dari teks
function parseSoal(text) {
    const soalArray = text.split('\n\n').filter(soal => soal.trim() !== '');
    return soalArray.map((soalText, index) => {
        const lines = soalText.split('\n').filter(line => line.trim() !== '');
        const nomor = index + 1;
        const pertanyaan = lines[0].split('. ')[1] || lines[0];
        const opsi = {};
        let kunci = '';
        let gambar = null;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('a. ')) opsi.a = line.substring(3);
            else if (line.startsWith('b. ')) opsi.b = line.substring(3);
            else if (line.startsWith('c. ')) opsi.c = line.substring(3);
            else if (line.startsWith('d. ')) opsi.d = line.substring(3);
            else if (line.startsWith('Kunci:')) kunci = line.substring(7).trim();
            else if (line.startsWith('Gambar:')) gambar = line.substring(7).trim();
        }

        return { nomor, pertanyaan, opsi, kunci, gambar };
    });
}

// Tampilkan soal ke halaman
function tampilkanSoal(soalData) {
    const container = document.getElementById('soalContainer');
    container.innerHTML = '';

    soalData.forEach((soal, index) => {
        const soalDiv = document.createElement('div');
        soalDiv.className = 'soal';
        soalDiv.innerHTML = `
            <h3>${soal.nomor}. ${soal.pertanyaan}</h3>
            ${soal.gambar ? `<img src="gambar/${soal.gambar}" alt="Gambar soal">` : ''}
            ${['a', 'b', 'c', 'd'].map(opt => `
                <div class="opsi">
                    <input type="radio" name="soal${index}" id="soal${index}${opt}" value="${opt}">
                    <label for="soal${index}${opt}">${opt}. ${soal.opsi[opt]}</label>
                </div>`).join('')}
        `;
        container.appendChild(soalDiv);
    });
}

// Mulai timer ujian
function mulaiTimer(menit, display) {
    let timer = menit * 60;
    const interval = setInterval(() => {
        const m = Math.floor(timer / 60);
        const d = timer % 60;
        display.textContent = `${m}:${d < 10 ? '0' : ''}${d}`;

        if (--timer < 0) {
            clearInterval(interval);
            selesaiKuis();
        }
    }, 1000);
}

// Hitung skor akhir
function hitungSkor() {
    let skor = 0;
    soalData.forEach((soal, index) => {
        const pilihan = document.querySelector(`input[name="soal${index}"]:checked`);
        if (pilihan && pilihan.value === soal.kunci) {
            skor++;
        }
    });
    return skor;
}

// Proses selesai kuis
function selesaiKuis() {
    const skor = hitungSkor();
    simpanKeSpreadsheet(userData.nama, userData.kelas, skor);

    localStorage.setItem('hasilKuis', JSON.stringify({
        nama: userData.nama,
        kelas: userData.kelas,
        skor: skor
    }));

    window.location.href = 'hasil.html';
}

// Simpan ke Google Spreadsheet via Apps Script
function simpanKeSpreadsheet(nama, kelas, skor) {
    const url = 'https://script.google.com/macros/s/AKfycbwRw-01nYXMTC5j54-zd2MoNC5-sqGAbRZOazugIVliEcAh5EYRu-wygg3dFDF6EeMH/exec';

    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            nama, kelas, skor, timestamp: new Date().toISOString()
        })
    }).catch(err => console.error('Gagal kirim:', err));
}

// Event setelah DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Halaman Login
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', e => {
            e.preventDefault();
            const nama = document.getElementById('nama').value.trim();
            const kelasRadio = document.querySelector('input[name="kelas"]:checked');
            const password = document.getElementById('password').value;

            if (!nama || !kelasRadio) {
                alert('Nama dan kelas harus diisi!');
                return;
            }

            if (password === PASSWORD) {
                userData = { nama, kelas: kelasRadio.value };
                localStorage.setItem('userData', JSON.stringify(userData));
                window.location.href = 'kuis.html';
            } else {
                alert('Password salah!');
            }
        });
    }

    // Halaman Kuis
    if (document.getElementById('soalContainer')) {
        userData = JSON.parse(localStorage.getItem('userData') || '{}');

        if (!userData.nama || !userData.kelas) {
            alert('Silakan login terlebih dahulu.');
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('displayNama').textContent = userData.nama;
        document.getElementById('displayKelas').textContent = userData.kelas;
        mulaiTimer(WAKTU_UJIAN, document.getElementById('timer'));

        muatSoal().then(data => {
            soalData = data;
            tampilkanSoal(data);
        });

        document.getElementById('submitBtn').addEventListener('click', selesaiKuis);
    }

    // Halaman Hasil (jika ada)
    if (document.getElementById('hasilNama')) {
        const hasil = JSON.parse(localStorage.getItem('hasilKuis') || '{}');
        document.getElementById('hasilNama').textContent = hasil.nama || '-';
        document.getElementById('hasilKelas').textContent = hasil.kelas || '-';
        document.getElementById('skor').textContent = hasil.skor ?? '-';
    }
});
