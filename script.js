let reviews = [];
let currentReviewFilter = "all";
let reviewsDisplayed = 6;

let patients = {};
let currentUser = null;
let currentTab = "login";
let currentAppointmentId = null;
let isAdmin = false;
let currentAdminTab = "appointments";
let currentRating = 0;
let currentPatientTab = "appointments";
let selectedAppointmentId = null;

// 🔹 Carregar avaliações do banco
async function carregarAvaliacoes() {
  try {
    const data = await res.json();

    if (data.sucesso) {
      reviews = data.avaliacoes || [];

      atualizarEstatisticasAvaliacoes();
      loadReviews();
    }
  } catch (erro) {
    console.error("Erro ao carregar avaliações:", erro);
  }
}

function atualizarEstatisticasAvaliacoes() {
  if (!Array.isArray(reviews)) return;

  const total = reviews.length;

  const ratingElement = document.getElementById("averageRating");
  const countElement = document.getElementById("reviewsCount");

  if (!ratingElement || !countElement) return;

  if (total === 0) {
    ratingElement.textContent = "0.0";
    countElement.textContent = "0";
    return;
  }

  let soma = 0;

  const distribuicao = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  reviews.forEach((r) => {
    const rating = Number(r.rating) || 0;

    soma += rating;

    if (distribuicao[rating] !== undefined) {
      distribuicao[rating]++;
    }
  });

  const media = (soma / total).toFixed(1);

  ratingElement.textContent = media;
  countElement.textContent = total;

  for (let i = 1; i <= 5; i++) {
    const count = distribuicao[i];
    const percent = total > 0 ? (count / total) * 100 : 0;

    const bar = document.getElementById("bar" + i);
    const label = document.getElementById("count" + i);

    if (bar) bar.style.width = percent + "%";
    if (label) label.textContent = count;
  }
}

// 🔹 Enviar avaliação
async function enviarAvaliacao() {
  const nomeInput = document.getElementById("reviewName");
  const tratamentoInput = document.getElementById("reviewTreatment");
  const comentarioInput = document.getElementById("reviewComment");

  if (!nomeInput || !tratamentoInput || !comentarioInput) {
    console.error("Campos do formulário não encontrados.");
    showAlert("Erro no formulário.", "error");
    return;
  }

  const nome = nomeInput.value.trim();
  const tratamento = tratamentoInput.value;
  const comentario = comentarioInput.value.trim();

  if (!nome) {
    showAlert("Digite seu nome.", "warning");
    return;
  }

  if (!tratamento) {
    showAlert("Selecione o tratamento.", "warning");
    return;
  }

  if (currentRating === 0) {
    showAlert("Selecione uma nota antes de enviar.", "warning");
    return;
  }

  if (!comentario) {
    showAlert("Digite um comentário.", "warning");
    return;
  }

  try {
    const response = await {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: nome,
        tratamento: tratamento,
        rating: currentRating,
        comentario: comentario,
      }),
    };

    const data = await response.json();

    if (data.sucesso) {
      showAlert("Avaliação enviada com sucesso!");

      document.getElementById("reviewForm").reset();

      currentRating = 0;

      const stars = document.querySelectorAll("#starRating .star-btn");

      stars.forEach((star) => {
        star.classList.remove("text-yellow-400");
        star.classList.add("text-gray-300");
      });

      carregarAvaliacoes();
    } else {
      showAlert(data.mensagem || "Erro ao enviar avaliação.", "error");
    }
  } catch (erro) {
    console.error("Erro:", erro);
    showAlert("Erro ao conectar com o servidor.", "error");
  }
}

// ⭐ Definir rating
function setRating(rating) {
  currentRating = rating;

  const ratingInput = document.getElementById("selectedRating");
  if (ratingInput) {
    ratingInput.value = rating;
  }

  const stars = document.querySelectorAll(".star-btn");

  stars.forEach((star, index) => {
    if (index < rating) {
      star.className = "star-btn text-3xl text-yellow-400 transition-colors";
    } else {
      star.className =
        "star-btn text-3xl text-gray-300 hover:text-yellow-400 transition-colors";
    }
  });

  const ratingTexts = {
    1: "Muito Ruim",
    2: "Ruim",
    3: "Regular",
    4: "Bom",
    5: "Excelente",
  };

  const ratingText = document.getElementById("ratingText");

  if (ratingText) {
    ratingText.textContent = ratingTexts[rating] || "";
  }
}

function likeReview(reviewId) {
  showAlert("Obrigado pelo feedback!");
}

async function submitReview(name, treatment, rating, comment) {
  try {
    const response = await {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: name,
        tratamento: treatment,
        rating: rating,
        comentario: comment,
      }),
    };

    const data = await response.json();

    if (data.sucesso) {
      const form = document.getElementById("reviewForm");
      const success = document.getElementById("reviewSuccessMessage");

      if (form) form.style.display = "none";
      if (success) success.classList.remove("hidden");

      carregarAvaliacoes();

      setTimeout(() => {
        if (form) form.style.display = "block";
        if (success) success.classList.add("hidden");

        if (form) form.reset();

        setRating(0);
        currentRating = 0;
      }, 5000);
    } else {
      showAlert(data.mensagem || "Erro ao enviar avaliação.", "error");
    }
  } catch (erro) {
    console.error("Erro:", erro);
    showAlert("Erro ao conectar com o servidor.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const reviewForm = document.getElementById("reviewForm");

  if (!reviewForm) return;

  reviewForm.addEventListener("submit", function (e) {
    e.preventDefault(); // impede recarregar a página
    enviarAvaliacao(); // chama sua função
  });
});

// 🔹 Formatar data segura
function formatarDataSegura(data) {
  if (!data) return "";

  // Se vier só YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const partes = data.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  // Se vier com horário
  return new Date(data).toLocaleDateString("pt-BR");
}

// 🔹 Converter ISO para BR
function formatarDataBR(dataISO) {
  if (!dataISO) return "";

  const partes = dataISO.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// 🔹 Carregar avaliações quando abrir o site

function switchAdminTab(tab) {
  currentAdminTab = tab;
  const appointmentsTab = document.getElementById("appointmentsTab");
  const patientsTab = document.getElementById("patientsTab");
  const appointmentsSection = document.getElementById("appointmentsSection");
  const patientsSection = document.getElementById("patientsSection");

  // Reset all tabs
  appointmentsTab.className =
    "flex-1 py-3 px-4 text-sm rounded-lg font-medium transition-colors text-gray-600 hover:text-gray-900";
  patientsTab.className =
    "flex-1 py-3 px-4 text-sm rounded-lg font-medium transition-colors text-gray-600 hover:text-gray-900";

  // Hide all sections
  appointmentsSection.classList.add("hidden");
  patientsSection.classList.add("hidden");

  if (tab === "appointments") {
    appointmentsTab.className =
      "flex-1 py-3 px-4 text-sm rounded-lg font-medium transition-colors bg-white text-blue-600 shadow-sm";
    appointmentsSection.classList.remove("hidden");
  } else if (tab === "patients") {
    patientsTab.className =
      "flex-1 py-3 px-4 text-sm rounded-lg font-medium transition-colors bg-white text-purple-600 shadow-sm";
    patientsSection.classList.remove("hidden");
    loadPatientsHistory();
  }
}

function loadPatientsHistory() {
  const patientsList = document.getElementById("patientsList");
  const noPatients = document.getElementById("noPatients");
  const searchTerm = document
    .getElementById("patientSearch")
    .value.toLowerCase();
  const statusFilter = document.getElementById("statusFilter").value;

  const patientsArray = Object.values(patients);

  if (patientsArray.length === 0) {
    patientsList.innerHTML = "";
    noPatients.classList.remove("hidden");
    return;
  }

  // Filtrar pacientes
  const filteredPatients = patientsArray.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm) ||
      (patient.phone && patient.phone.includes(searchTerm));

    if (!matchesSearch) return false;

    if (statusFilter) {
      const hasActiveAppointments =
        patient.appointments && patient.appointments.length > 0;
      const isActive = hasActiveAppointments;

      if (statusFilter === "Ativo" && !isActive) return false;
      if (statusFilter === "Inativo" && isActive) return false;
    }

    return true;
  });

  if (filteredPatients.length === 0) {
    patientsList.innerHTML =
      '<div class="text-center py-8 text-gray-500">Nenhum paciente encontrado com os filtros aplicados.</div>';
    noPatients.classList.add("hidden");
    return;
  }

  noPatients.classList.add("hidden");

  // Ordenar pacientes por nome
  filteredPatients.sort((a, b) => a.name.localeCompare(b.name));

  patientsList.innerHTML = filteredPatients
    .map((patient) => {
      const totalAppointments = patient.appointments
        ? patient.appointments.length
        : 0;
      const confirmedAppointments = patient.appointments
        ? patient.appointments.filter(
            (app) => (app.status || "").toLowerCase() === "confirmado",
          ).length
        : 0;
      const cancelledAppointments = patient.cancelledAppointments?.length || 0;

      const realizedAppointments = patient.appointments
        ? patient.appointments.filter(
            (app) => (app.status || "").toLowerCase() === "realizado",
          ).length
        : 0;
      const hasActiveAppointments = totalAppointments > 0;
      const lastAppointment =
        patient.appointments && patient.appointments.length > 0
          ? [...patient.appointments].sort((a, b) =>
              (b.date || "").localeCompare(a.date || ""),
            )[0]
          : null;

      const statusBadge = hasActiveAppointments
        ? '<span class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Ativo</span>'
        : '<span class="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">Inativo</span>';

      return `
                    <div class="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex-1">
                                <div class="flex items-center space-x-3 mb-3">
                                    <h3 class="text-lg font-semibold text-gray-900">${
                                      patient.name
                                    }</h3>
                                    ${statusBadge}
                                </div>
                                
                                <div class="grid md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p class="text-sm font-medium text-gray-700 mb-1">Informações de Contato:</p>
                                        <p class="text-sm text-gray-600">📧 ${
                                          patient.email
                                        }</p>
                                        <p class="text-sm text-gray-600">📱 ${
                                          patient.phone || "Não informado"
                                        }</p>
                                    </div>
                                    <div>
                                        <p class="text-sm font-medium text-gray-700 mb-1">Estatísticas:</p>
                                        <p class="text-sm text-gray-600">📅 ${totalAppointments} agendamento(s) total</p>
                                        <p class="text-sm text-gray-600">✅ ${confirmedAppointments} confirmado(s)</p>
                                        <p class="text-sm text-gray-600">🔵 ${realizedAppointments} realizado(s)</p>
                                        <p class="text-sm text-gray-600">❌ ${cancelledAppointments} cancelado(s)</p>
                                    </div>
                                </div>
                                
                                ${
                                  lastAppointment
                                    ? `
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
          <p class="text-sm font-medium text-blue-900 mb-1">Último Agendamento:</p>
          <p class="text-sm text-blue-800">
            ${lastAppointment.type} - 
            ${formatarDataBR(lastAppointment.date)} às 
            ${lastAppointment.time}
          </p>
          <p class="text-sm text-blue-700">
            Status: ${lastAppointment.status}
          </p>
      </div>
    `
                                    : ""
                                }
                                
                                ${
                                  patient.appointments &&
                                  patient.appointments.length > 0
                                    ? `
                                    <div class="mb-4">
                                        <button onclick="togglePatientDetails('${
                                          patient.email
                                        }')" class="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
                                            Ver Histórico Completo ▼
                                        </button>
                                        <div id="details-${patient.email.replace(
                                          /[^a-zA-Z0-9]/g,
                                          "",
                                        )}" class="hidden mt-3 space-y-2">
                                            ${patient.appointments
                                              .map(
                                                (appointment) => `
                                                <div class="bg-white border border-gray-200 rounded-lg p-3">
                                                    <div class="flex justify-between items-center">
                                                        <div>
                                                            <p class="font-medium text-gray-900">${
                                                              appointment.type
                                                            }</p>
                                                            <p class="text-sm text-gray-600">${formatarDataBR(appointment.date)} às ${appointment.time}</p>
                                                            ${
                                                              appointment.notes
                                                                ? `<p class="text-sm text-gray-500">${appointment.notes}</p>`
                                                                : ""
                                                            }
                                                        </div>
<span class="px-2 py-1 rounded-full text-xs font-medium ${
                                                  appointment.status.toLowerCase() ===
                                                  "confirmado"
                                                    ? "bg-green-100 text-green-800"
                                                    : appointment.status.toLowerCase() ===
                                                        "pendente"
                                                      ? "bg-yellow-100 text-yellow-800"
                                                      : appointment.status.toLowerCase() ===
                                                          "cancelado"
                                                        ? "bg-red-100 text-red-800"
                                                        : appointment.status.toLowerCase() ===
                                                            "realizado"
                                                          ? "bg-blue-100 text-blue-800"
                                                          : "bg-gray-100 text-gray-800"
                                                }">
  ${appointment.status}
</span>
                                                    </div>
                                                </div>
                                            `,
                                              )
                                              .join("")}
                                            
                                            ${
                                              patient.cancelledAppointments &&
                                              patient.cancelledAppointments
                                                .length > 0
                                                ? `
                                                <div class="border-t border-gray-200 pt-3 mt-3">
                                                    <p class="text-sm font-medium text-gray-700 mb-2">Agendamentos Cancelados:</p>
                                                    ${patient.cancelledAppointments
                                                      .map(
                                                        (cancelled) => `
                                                        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                                                            <div class="flex justify-between items-center">
                                                                <div>
                                                                    <p class="font-medium text-red-900">${
                                                                      cancelled.type
                                                                    }</p>
                                                                    <p class="text-sm text-red-700">${new Date(
                                                                      cancelled.date,
                                                                    ).toLocaleDateString(
                                                                      "pt-BR",
                                                                    )} às ${
                                                                      cancelled.time
                                                                    }</p>
                                                                    <p class="text-xs text-red-600">Cancelado em: ${new Date(
                                                                      cancelled.cancelledAt,
                                                                    ).toLocaleDateString(
                                                                      "pt-BR",
                                                                    )}</p>
                                                                    ${
                                                                      cancelled.cancelReason
                                                                        ? `<p class="text-xs text-red-600">Motivo: ${cancelled.cancelReason}</p>`
                                                                        : ""
                                                                    }
                                                                </div>
                                                                <span class="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                    Cancelado
                                                                </span>
                                                            </div>
                                                        </div>
                                                    `,
                                                      )
                                                      .join("")}
                                                </div>
                                            `
                                                : ""
                                            }
                                        </div>
                                    </div>
                                `
                                    : ""
                                }
                            </div>
                        </div>
                        
                        <div class="flex space-x-3">
                            <button onclick="sendWhatsAppMessage('${patient.telefone}', 'Olá ${patient.name}! Como você está? Gostaria de agendar uma nova consulta conosco?')" class="flex-1 bg-green-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors text-sm">
                                💬 WhatsApp
                            </button>
                            <button onclick="createNewAppointmentForPatient('${
                              patient.email
                            }')" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm">
                                📅 Novo Agendamento
                            </button>
                        </div>
                    </div>
                `;
    })
    .join("");
}

function togglePatientDetails(patientEmail) {
  const detailsId = "details-" + patientEmail.replace(/[^a-zA-Z0-9]/g, "");
  const detailsDiv = document.getElementById(detailsId);
  const button = detailsDiv.previousElementSibling;

  if (detailsDiv.classList.contains("hidden")) {
    detailsDiv.classList.remove("hidden");
    button.innerHTML = button.innerHTML.replace("▼", "▲");
  } else {
    detailsDiv.classList.add("hidden");
    button.innerHTML = button.innerHTML.replace("▲", "▼");
  }
}

function createNewAppointmentForPatient(patientEmail) {
  const patient = patients[patientEmail];
  if (!patient) return;

  // Criar modal para novo agendamento
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50";
  modal.innerHTML = `
                <div class="bg-white rounded-3xl shadow-xl max-w-md w-full p-6">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-white text-2xl">📅</span>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900">Novo Agendamento</h2>
                        <p class="text-gray-600">Criar agendamento para ${patient.name}</p>
                    </div>
                    
                    <form id="newAppointmentForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Data</label>
                            <input type="date" id="appointmentDate" required class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Horário</label>
                            <select id="appointmentTime" required class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                                <option value="">Selecione um horário</option>
                                <option value="09:00">09:00</option>
                                <option value="10:00">10:00</option>
                                <option value="11:00">11:00</option>
                                <option value="12:00">12:00</option>
                                <option value="13:00">13:00</option>
                                <option value="14:00">14:00</option>
                                <option value="15:00">15:00</option>
                                <option value="16:00">16:00</option>
                                <option value="17:00">17:00</option>
                                <option value="18:00">18:00</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de Consulta</label>
                            <select id="appointmentType" required class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                                <option value="">Selecione o tipo</option>
                                <option value="Avaliação Geral">Avaliação Geral</option>
                                <option value="Restauração">Restauração</option>
                                <option value="Limpeza">Limpeza</option>
                                <option value="Clareamento">Clareamento</option>
                                <option value="Facetas em Resina">Facetas em Resina</option>
                                <option value="Cirurgia Oral">Cirurgia Oral</option>
                                <option value="Botox">Botox</option>
                                <option value="Preenchimento Labial">Preenchimento Labial</option>
                                <option value="Ortodontia">Ortodontia</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Observações</label>
                            <textarea id="appointmentNotes" rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Observações sobre o agendamento..."></textarea>
                        </div>
                        
                        <div class="flex space-x-3">
                            <button type="button" onclick="document.body.removeChild(this.closest('.fixed'))" class="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-400 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" class="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                                Criar Agendamento
                            </button>
                        </div>
                    </form>
                </div>
            `;

  document.body.appendChild(modal);

  // Definir data mínima como hoje
  const today = new Date().toISOString().split("T")[0];
  modal.querySelector("#appointmentDate").setAttribute("min", today);

  // Event listener para o formulário
}

function toggleMobileMenu() {
  const mobileMenu = document.getElementById("mobileMenu");
  mobileMenu.classList.toggle("hidden");
}

function handleLoginClick() {
  if (currentUser) {
    if (isAdmin) {
      showAdminDashboard();
    } else {
      showDashboard();
    }
  } else {
    showLogin();
  }
}
function updateLoginButton() {
  const loginBtnText = document.getElementById("loginBtnText");
  const mobileLoginBtnText = document.getElementById("mobileLoginBtnText");
  const logoutBtn = document.getElementById("logoutBtn");
  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");

  // 🔥 evita erro se não existir
  if (!loginBtnText || !mobileLoginBtnText) return;

  if (currentUser) {
    const icon = isAdmin ? "👨‍⚕️" : "👤";

    const nome = currentUser.nome || currentUser.name || "Usuário";

    loginBtnText.textContent = `${icon} ${nome}`;
    mobileLoginBtnText.textContent = `${icon} ${nome}`;

    // Mostrar botão logout (se existir)
    if (logoutBtn) logoutBtn.classList.remove("hidden");
    if (mobileLogoutBtn) mobileLogoutBtn.classList.remove("hidden");
  } else {
    loginBtnText.textContent = "👤 Login";
    mobileLoginBtnText.textContent = "👤 Login";

    // Esconder logout
    if (logoutBtn) logoutBtn.classList.add("hidden");
    if (mobileLogoutBtn) mobileLogoutBtn.classList.add("hidden");
  }
}

function handleLogout() {
  // evita abrir mais de um modal
  if (document.getElementById("logoutModal")) return;

  const modal = document.createElement("div");
  modal.id = "logoutModal";
  modal.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50";

  const nome = currentUser?.name || "Usuário";
  const email = currentUser?.email || "";
  const tipo = isAdmin ? "Administrador" : "Paciente";
  const icon = isAdmin ? "👨‍⚕️" : "👤";
  const bgIcon = isAdmin ? "bg-purple-100" : "bg-blue-100";

  modal.innerHTML = `
    <div class="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6">
      <div class="text-center mb-6">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-red-600 text-2xl">🚪</span>
        </div>

        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          Sair da Conta
        </h2>

        <p class="text-gray-600">
          Tem certeza que deseja sair da sua conta?
        </p>
      </div>

      <div class="bg-gray-50 rounded-xl p-4 mb-6">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 ${bgIcon} rounded-full flex items-center justify-center">
            <span class="text-xl">${icon}</span>
          </div>

          <div>
            <p class="font-medium text-gray-900">${nome}</p>
            <p class="text-sm text-gray-600">${email}</p>
            <p class="text-xs text-gray-500">${tipo}</p>
          </div>
        </div>
      </div>

      <div class="flex space-x-3">

        <button 
          onclick="document.getElementById('logoutModal').remove()"
          class="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-400 transition-colors">
          Cancelar
        </button>

        <button 
          onclick="confirmLogout(this)"
          class="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-red-700 transition-colors">
          Sair
        </button>

      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

async function confirmLogout(btn) {
  if (!btn) return;

  btn.innerText = "Saindo...";
  btn.disabled = true;

  try {
    await {
      method: "POST",
      credentials: "include",
    };

    localStorage.removeItem("paciente_logado");

    currentUser = null;
    isAdmin = false;

    const modal = btn.closest(".fixed");
    if (modal) modal.remove();

    document.getElementById("adminDashboard")?.classList.add("hidden");

    atualizarMenuUsuario();
  } catch (e) {
    showAlert("Erro ao sair da conta.", "error");

    btn.innerText = "Sair";
    btn.disabled = false;
  }
}

function showLogin() {
  const modal = document.getElementById("loginModal");
  if (!modal) return;

  modal.classList.remove("hidden"); // ✅ CORRETO
  switchTab("login");
}

function hideLogin() {
  const modal = document.getElementById("loginModal");
  if (!modal) return;

  modal.classList.add("hidden"); // ✅ CORRETO

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) loginForm.reset();
  if (registerForm) registerForm.reset();
}

function switchTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const adminForm = document.getElementById("adminForm");

  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const adminTab = document.getElementById("adminTab");

  const modalTitle = document.getElementById("modalTitle");
  const modalSubtitle = document.getElementById("modalSubtitle");

  // 🔴 ESCONDE TODOS (SEM TAILWIND)
  loginForm.style.display = "none";
  registerForm.style.display = "none";
  adminForm.style.display = "none";

  // reset visual das abas
  loginTab.className =
    "flex-1 py-2 px-2 text-sm rounded-lg font-medium text-gray-600 hover:text-gray-900";
  registerTab.className =
    "flex-1 py-2 px-2 text-sm rounded-lg font-medium text-gray-600 hover:text-gray-900";
  adminTab.className =
    "flex-1 py-2 px-2 text-sm rounded-lg font-medium text-gray-600 hover:text-gray-900";

  // ================= PACIENTE =================
  if (tab === "login") {
    loginForm.style.display = "block";

    loginTab.className =
      "flex-1 py-2 px-2 text-sm rounded-lg font-medium bg-white text-blue-600 shadow-sm";

    modalTitle.textContent = "Área do Paciente";
    modalSubtitle.textContent = "Acesse sua conta para ver seus agendamentos";
  }

  // ================= CADASTRO =================
  if (tab === "register") {
    registerForm.style.display = "block";

    registerTab.className =
      "flex-1 py-2 px-2 text-sm rounded-lg font-medium bg-white text-green-600 shadow-sm";

    modalTitle.textContent = "Criar Conta";
    modalSubtitle.textContent =
      "Cadastre-se para agendar e gerenciar suas consultas";
  }

  // ================= ADMIN / DOUTOR =================
  if (tab === "admin") {
    adminForm.style.display = "block";

    adminTab.className =
      "flex-1 py-2 px-2 text-sm rounded-lg font-medium bg-white text-purple-600 shadow-sm";

    modalTitle.textContent = "Acesso Administrativo";
    modalSubtitle.textContent = "Área restrita para profissionais da clínica";
  }
}

function switchPatientTab(tab) {
  currentPatientTab = tab;

  const appointmentsTab = document.getElementById("patientAppointmentsTab");
  const historyTab = document.getElementById("patientHistoryTab");
  const appointmentsSection = document.getElementById(
    "patientAppointmentsSection",
  );
  const historySection = document.getElementById("patientHistorySection");

  // Reset abas
  appointmentsTab.className =
    "flex-1 py-3 px-4 text-sm rounded-lg font-medium transition-colors text-gray-600 hover:text-gray-900";

  historyTab.className =
    "flex-1 py-3 px-4 text-sm rounded-lg font-medium transition-colors text-gray-600 hover:text-gray-900";

  // Esconde seções
  appointmentsSection.classList.add("hidden");
  historySection.classList.add("hidden");

  if (tab === "appointments") {
    appointmentsTab.className =
      "flex-1 py-3 px-4 text-sm rounded-lg font-medium transition-colors bg-white text-blue-600 shadow-sm";

    appointmentsSection.classList.remove("hidden");

    // 🔥 AGORA CHAMA CORRETAMENTE
    carregarMeusAgendamentos("appointments");
  } else if (tab === "history") {
    historyTab.className =
      "flex-1 py-3 px-4 text-sm rounded-lg font-medium transition-colors bg-white text-purple-600 shadow-sm";

    historySection.classList.remove("hidden");

    // 🔥 AGORA CHAMA CORRETAMENTE
    carregarMeusAgendamentos("history");
  }
}

async function showDashboard() {
  try {
    // Buscar sessão real no backend (PHP)
    const res = await {
      credentials: "include",
    };
    const data = await res.json();

    // Se não estiver logado, volta para login
    if (!data.logado) {
      showLogin();
      return;
    }

    // Definir usuário global a partir do backend
    isAdmin = data.tipo === "admin";
    currentUser = {
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
    };
    // Mostrar dashboard do paciente
    document.getElementById("patientDashboard").classList.remove("hidden");

    // Aceita nome vindo do banco (nome) ou fallback
    const nome = currentUser.nome || currentUser.name || "Paciente";

    document.getElementById("dashboardWelcome").textContent =
      `Bem-vindo(a), ${nome}!`;

    // Mostrar informações do paciente
    const patientInfo = document.getElementById("patientInfo");

    const email = currentUser.email || "Email não informado";
    const phone =
      currentUser.telefone || currentUser.phone || "Telefone não informado";

    patientInfo.innerHTML = `
      <div class="flex flex-col space-y-1">
        <span>📧 ${email}</span>
        <span>📱 ${phone}</span>
      </div>
    `;

    // Carregar aba inicial
    switchPatientTab("appointments");
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    showMessage("Erro ao carregar dados do usuário.", "error");
    showLogin();
  }
}

function hideDashboard() {
  document.getElementById("patientDashboard").classList.add("hidden");
}

async function loadTreatmentHistory() {
  const historyList = document.getElementById("treatmentHistoryList");
  const noHistory = document.getElementById("noTreatmentHistory");
  const filterValue = document.getElementById("historyFilter").value;

  try {
    const response = await {
      credentials: "include",
    };

    const data = await response.json();

    if (!data.sucesso || data.historico.length === 0) {
      historyList.innerHTML = "";
      noHistory.classList.remove("hidden");
      return;
    }

    let filteredHistory = data.historico;

    // Aplicar filtro por tipo
    if (filterValue) {
      filteredHistory = filteredHistory.filter(
        (item) => item.tipo_consulta === filterValue,
      );
    }

    if (filteredHistory.length === 0) {
      historyList.innerHTML =
        '<div class="text-center py-8 text-gray-500">Nenhum tratamento encontrado com o filtro aplicado.</div>';
      noHistory.classList.add("hidden");
      return;
    }

    noHistory.classList.add("hidden");

    // Ordenar por data (mais recentes primeiro)
    filteredHistory.sort((a, b) => {
      return (b.data + b.horario).localeCompare(a.data + a.horario);
    });

    historyList.innerHTML = filteredHistory
      .map((treatment) => {
        const treatmentDate = new Date(
          treatment.data + " " + treatment.horario,
        );

        const formattedDate = treatmentDate.toLocaleDateString("pt-BR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        return `
          <div class="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div class="flex justify-between items-start mb-4">
                  <div class="flex-1">
                      <div class="flex items-center space-x-3 mb-3">
                          <h3 class="text-lg font-semibold text-gray-900">
                              ${treatment.tipo_consulta}
                          </h3>
                          <span class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              Concluído
                          </span>
                      </div>

                      <div class="mb-4">
                          <p class="text-sm font-medium text-gray-700 mb-2">📅 Data do Tratamento:</p>
                          <p class="text-gray-900 capitalize">
                              ${formattedDate} às ${treatment.horario}
                          </p>
                      </div>

                      ${
                        treatment.observacoes
                          ? `
                          <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3">
                              <p class="text-sm font-medium text-blue-900 mb-1">📝 Observações:</p>
                              <p class="text-blue-800 text-sm">${treatment.observacoes}</p>
                          </div>
                      `
                          : ""
                      }
                  </div>
              </div>

              <div class="flex space-x-3">
                  <button onclick="sendWhatsAppMessage('${treatment.telefone}', 'Olá! Gostaria de tirar dúvidas sobre meu tratamento de ${treatment.tipo_consulta} realizado em ${treatmentDate.toLocaleDateString("pt-BR")}')"
                      class="flex-1 bg-green-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors text-sm">
                      💬 Tirar Dúvidas
                  </button>

                  <button onclick="sendWhatsAppMessage('${treatment.telefone}', 'Olá! Gostaria de agendar um retorno referente ao meu tratamento de ${treatment.tipo_consulta}')" 
                      class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm">
                      📅 Agendar Retorno
                  </button>
              </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
    historyList.innerHTML =
      '<div class="text-center py-8 text-red-500">Erro ao carregar histórico.</div>';
  }
}

function updateFinancialSummary(treatments) {
  const totalSpentElement = document.getElementById("totalSpent");
  const totalTreatmentsElement = document.getElementById("totalTreatments");
  const lastTreatmentDateElement = document.getElementById("lastTreatmentDate");

  if (!treatments || treatments.length === 0) {
    totalSpentElement.textContent = "R$ 0,00";
    totalTreatmentsElement.textContent = "0";
    lastTreatmentDateElement.textContent = "-";
    return;
  }

  const totalSpent = treatments.reduce((sum, treatment) => {
    const cost = Number(
      String(treatment.cost)
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim(),
    );
    return sum + (isNaN(cost) ? 0 : cost);
  }, 0);

  totalSpentElement.textContent = totalSpent.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const sortedByDate = [...treatments].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  lastTreatmentDateElement.textContent = new Date(
    sortedByDate[0].date,
  ).toLocaleDateString("pt-BR");

  totalTreatmentsElement.textContent = treatments.length.toString();
}

function showChangeDateModal(appointmentId) {
  currentAppointmentId = appointmentId;
  document.getElementById("changeDateModal").classList.remove("hidden");

  // Definir data mínima como hoje
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("newDate").setAttribute("min", today);
}

function hideChangeDateModal() {
  document.getElementById("changeDateModal").classList.add("hidden");
  document.getElementById("changeDateForm").reset();
  currentAppointmentId = null;
}

async function confirmPatientCancellation(appointmentId, buttonElement) {
  const modal = buttonElement.closest(".fixed");

  const reasonSelect = modal.querySelector("#cancelReasonSelect").value;
  const reasonText = modal.querySelector("#cancelReasonText").value;

  const fullReason = reasonSelect + (reasonText ? ` - ${reasonText}` : "");

  try {
    const formData = new FormData();
    formData.append("appointment_id", appointmentId);
    formData.append("motivo", fullReason);

    const res = await {
      method: "POST",
      body: formData,
      credentials: "include",
    };

    const data = await res.json();

    if (!data.sucesso) {
      showMessage(data.mensagem || "Erro ao cancelar agendamento", "error");
      return;
    }

    // fechar modal
    document.body.removeChild(modal);

    showMessage("Agendamento cancelado com sucesso!", "success");

    // 🔄 recarregar agendamentos reais do banco
    loadAppointmentsFromBackend();

    // WhatsApp continua opcional (UX)
    setTimeout(() => {
      if (
        confirm("Deseja notificar a clínica sobre o cancelamento via WhatsApp?")
      ) {
        sendWhatsAppMessage(data.telefone, data.mensagem_whatsapp);
      }
    }, 800);
  } catch (err) {
    console.error(err);
    showMessage("Erro ao conectar com o servidor!", "error");
  }
}
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const loginMsg = document.getElementById("loginMsg");

    if (loginMsg) {
      loginMsg.className = "text-sm font-semibold text-blue-600";
      loginMsg.innerText = "Entrando...";
    }

    const formData = new FormData(loginForm);

    try {
      const res = await {
        method: "POST",
        credentials: "include",
        body: formData,
      };

      // 🔥 evita erro de JSON quebrado
      const text = await res.text();

      if (!text) {
        throw new Error("Resposta vazia");
      }

      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Erro JSON:", text);
        throw new Error("Erro no servidor");
      }

      if (data.sucesso) {
        if (loginMsg) {
          loginMsg.className = "text-sm font-semibold text-green-600";
          loginMsg.innerText = "Login feito com sucesso!";
        }

        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        if (loginMsg) {
          loginMsg.className = "text-sm font-semibold text-red-600";
          loginMsg.innerText = data.mensagem || "Email ou senha incorretos!";
        }
      }
    } catch (err) {
      console.error(err);

      if (loginMsg) {
        loginMsg.className = "text-sm font-semibold text-red-600";
        loginMsg.innerText = "Erro ao conectar com o servidor.";
      }
    }
  });
}

function fillAppointmentForm(name, email, phone) {
  // Preencher os campos do formulário de agendamento
  const agendamentoForm = document.getElementById("agendamentoForm");
  if (agendamentoForm) {
    const nameInput = agendamentoForm.querySelector('input[type="text"]');
    const emailInput = agendamentoForm.querySelector('input[type="email"]');
    const phoneInput = agendamentoForm.querySelector('input[type="tel"]');

    if (nameInput) nameInput.value = name || "";
    if (emailInput) emailInput.value = email || "";
    if (phoneInput) phoneInput.value = phone || "";
  }
}

function showAdminDashboard() {
  console.log("admin dashbird aberto");
  if (!currentUser || !isAdmin) return;

  document.getElementById("adminDashboard").classList.remove("hidden");

  document.getElementById("adminWelcome").textContent =
    `Bem-vindo(a), ${currentUser.name}!`;

  // 🔥 Carrega estatísticas antigas (se já existir)
  loadAdminData();

  // 🔥 Carrega agendamentos do banco
  carregarAgendamentosAdmin();
}

function hideAdminDashboard() {
  document.getElementById("adminDashboard").classList.add("hidden");
}

async function loadAdminData() {
  try {
    const res = await {
      credentials: "include",
    };

    const data = await res.json();
    if (!data.sucesso) return;

    const agendamentos = data.agendamentos;

    // 🔥 Resetar patients
    patients = {};

    // 🔥 Construir objeto patients a partir dos agendamentos
    agendamentos.forEach((a) => {
      const statusLower = (a.status || "").toLowerCase();

      if (!patients[a.paciente_id]) {
        patients[a.paciente_id] = {
          id: a.paciente_id,
          name: a.nome,
          email: a.email,
          phone: a.telefone,
          appointments: [],
          cancelledAppointments: [],
        };
      }

      const appointmentData = {
        type: a.tipo_consulta,
        date: a.data,
        time: a.horario,
        status: a.status,
        notes: a.observacoes,
      };

      if (statusLower === "cancelado") {
        patients[a.paciente_id].cancelledAppointments.push(appointmentData);
      } else {
        patients[a.paciente_id].appointments.push(appointmentData);
      }
    });

    console.log("AGENDAMENTOS RECEBIDOS:", agendamentos);

    // 🔢 Estatísticas do painel
    const totalAppointments = agendamentos.length;

    const confirmedAppointments = agendamentos.filter(
      (a) => (a.status || "").toLowerCase() === "confirmado",
    ).length;

    const pendingAppointments = agendamentos.filter(
      (a) => (a.status || "").toLowerCase() === "pendente",
    ).length;

    const totalPatients = Object.keys(patients).length;

    // 🧾 Atualizar cards do dashboard
    document.getElementById("totalAppointments").textContent =
      totalAppointments;

    document.getElementById("confirmedAppointments").textContent =
      confirmedAppointments;

    document.getElementById("pendingAppointments").textContent =
      pendingAppointments;

    document.getElementById("totalPatients").textContent = totalPatients;

    // 🔥 Atualizar tabelas
    loadAdminAppointments(agendamentos);
    loadPatientsHistory();
  } catch (err) {
    console.error("Erro ao carregar dados do admin:", err);
  }
}
function loadAdminAppointments(appointments) {
  const appointmentsList = document.getElementById("adminAppointmentsList");
  const noAppointments = document.getElementById("noAdminAppointments");

  if (!appointments || appointments.length === 0) {
    appointmentsList.innerHTML = "";
    noAppointments.classList.remove("hidden");
    return;
  }

  // ✅ FILTRA APENAS CONFIRMADO E PENDENTE
  const activeAppointments = appointments.filter((appointment) => {
    const status = (appointment.status || "").toLowerCase();
    return status === "confirmado" || status === "pendente";
  });

  if (activeAppointments.length === 0) {
    appointmentsList.innerHTML = "";
    noAppointments.classList.remove("hidden");
    return;
  }

  noAppointments.classList.add("hidden");

  const sortedAppointments = activeAppointments.sort((a, b) => {
    const dataA = new Date(a.data + " " + a.horario);
    const dataB = new Date(b.data + " " + b.horario);
    return dataA - dataB;
  });

  appointmentsList.innerHTML = sortedAppointments
    .map((appointment) => {
      const formattedDate = formatarDataBR(appointment.data);

      const statusColor =
        appointment.status === "confirmado"
          ? "bg-green-100 text-green-800"
          : "bg-yellow-100 text-yellow-800";

      return `
        <div class="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h3 class="text-lg font-semibold text-gray-900">
                  ${appointment.tipo_consulta}
                </h3>
                <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColor}">
                  ${appointment.status}
                </span>
              </div>

              <div class="grid md:grid-cols-2 gap-4 mb-3">
                <div>
                  <p class="text-sm font-medium text-gray-700">Paciente:</p>
                  <p class="text-gray-900">${appointment.nome}</p>
                  <p class="text-sm text-gray-600">${appointment.email}</p>
                  <p class="text-sm text-gray-600">${appointment.telefone}</p>
                </div>

                <div>
                  <div class="flex items-center space-x-4 text-gray-600 mb-2">
                    <div class="flex items-center space-x-1">
                      <span>📅</span>
                      <span>${formattedDate}</span>
                    </div>
                    <div class="flex items-center space-x-1">
                      <span>🕐</span>
                      <span>${appointment.horario}</span>
                    </div>
                  </div>

                  ${
                    appointment.observacoes
                      ? `<p class="text-gray-600 text-sm"><strong>Observações:</strong> ${appointment.observacoes}</p>`
                      : ""
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="flex space-x-3">

            ${
              appointment.status === "pendente"
                ? `
              <button onclick="confirmAppointment(${appointment.id})"
                class="flex-1 bg-green-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors text-sm">
                Confirmar
              </button>
              `
                : ""
            }

            <button onclick="showChangeDateModal(${appointment.id})"
              class="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-xl font-medium hover:bg-yellow-600 transition-colors text-sm">
              Alterar Data
            </button>

            <button onclick="cancelAdminAppointment(${appointment.id})"
              class="flex-1 bg-red-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-red-700 transition-colors text-sm">
              Cancelar
            </button>

            <button onclick="sendWhatsAppMessage('${appointment.telefone}', 'Olá ${appointment.nome}! Lembrete do seu agendamento de ${appointment.tipo_consulta} para ${formattedDate} às ${appointment.horario}.')"
              class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm">
              WhatsApp
            </button>

          </div>
        </div>
      `;
    })
    .join("");
}

function confirmCancellation(appointmentId, patientEmail, buttonElement) {
  const modal = buttonElement.closest(".fixed");
  const reason = modal.querySelector("#cancelReason").value;

  const patient = patients[patientEmail];

  if (!patient) {
    showMessage("Paciente não encontrado", "error");
    return;
  }

  const appointment = patient.appointments.find(
    (app) => app.id === appointmentId,
  );

  if (!appointment) {
    showMessage("Agendamento não encontrado", "error");
    return;
  }

  // Remover o agendamento
  patient.appointments = patient.appointments.filter(
    (app) => app.id !== appointmentId,
  );

  // Histórico de cancelamento
  if (!patient.cancelledAppointments) {
    patient.cancelledAppointments = [];
  }

  patient.cancelledAppointments.push({
    ...appointment,
    cancelledAt: new Date().toISOString(),
    cancelReason: reason || "Não informado",
    cancelledBy: "admin",
  });

  // Fechar modal
  document.body.removeChild(modal);

  // Atualizar dados
  loadAdminData();

  // Mensagem sucesso
  showMessage("Agendamento cancelado com sucesso!", "success");

  // WhatsApp
  const appointmentDate = formatarDataBR(appointment.date);

  const whatsappMessage = `Olá ${patient.name}! Infelizmente precisamos cancelar seu agendamento de ${appointment.type} marcado para ${appointmentDate} às ${appointment.time}. ${
    reason ? "Motivo: " + reason + ". " : ""
  }Entre em contato conosco para reagendar. Obrigado pela compreensão!`;

  setTimeout(() => {
    if (
      confirm(
        "Deseja enviar uma notificação via WhatsApp para o paciente sobre o cancelamento?",
      )
    ) {
      sendWhatsAppMessage(patient.phone, whatsappMessage); // ✅ CORRETO
    }
  }, 1000);
}
// ===============================
// REGISTRO DE PACIENTE (CORRIGIDO)
// ===============================
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("registerName")?.value.trim();
    const email = document.getElementById("registerEmail")?.value.trim();
    const phone = document.getElementById("registerPhone")?.value.trim();
    const password = document.getElementById("registerPassword")?.value;
    const confirmPassword = document.getElementById(
      "registerConfirmPassword",
    )?.value;

    // ✅ validações
    if (!name || !email || !phone || !password || !confirmPassword) {
      showMessage("Preencha todos os campos obrigatórios.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("As senhas não coincidem!", "error");
      return;
    }

    if (password.length < 6) {
      showMessage("A senha deve ter pelo menos 6 caracteres!", "error");
      return;
    }

    const formData = new FormData();
    formData.append("nome", name);
    formData.append("email", email);
    formData.append("telefone", phone);
    formData.append("senha", password);

    // 🔥 DEBUG (pode remover depois)
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      const res = await {
        method: "POST",
        body: formData,
        credentials: "include",
      };

      // 🔥 verifica erro HTTP (500, 404, etc.)
      if (!res.ok) {
        console.error("Erro HTTP:", res.status, res.statusText);
        showMessage("Erro no servidor (" + res.status + ")", "error");
        return;
      }

      const text = await res.text();

      // ⚠️ evita erro de resposta vazia
      if (!text || text.trim() === "") {
        console.error("Resposta vazia do servidor");
        showMessage("Erro no servidor (resposta vazia).", "error");
        return;
      }

      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Erro ao converter JSON:", text);
        showMessage("Erro inesperado do servidor.", "error");
        return;
      }

      // 🔥 erro vindo do backend
      if (!data.sucesso) {
        console.error("Erro do backend:", data);
        showMessage(data.erro || "Erro ao cadastrar.", "error");
        return;
      }

      // ✅ sucesso
      showMessage("Conta criada com sucesso! Agora faça login.", "success");
      registerForm.reset();

      if (typeof switchTab === "function") {
        switchTab("login");
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      showMessage("Erro ao conectar com o servidor.", "error");
    }

    // ✅ FECHAR O EVENT LISTENER
  });
}

// ✅ AGORA SIM fora do bloco
function showMessage(message, type) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
    type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
  }`;
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);

  setTimeout(() => {
    if (document.body.contains(messageDiv)) {
      document.body.removeChild(messageDiv);
    }
  }, 4000);
}

document
  .getElementById("changeDateForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const newDate = document.getElementById("newDate").value;
    const newTime = document.getElementById("newTime").value;

    if (currentAppointmentId && newDate && newTime) {
      changeAppointmentDate(currentAppointmentId, newDate, newTime);
    }
  });

function scrollToAgendamento() {
  document.getElementById("agendamento").scrollIntoView({
    behavior: "smooth",
  });
}
function scrollToServicos() {
  const secao = document.getElementById("servicos");

  if (secao) {
    secao.scrollIntoView({
      behavior: "smooth",
    });
  }
}

// Smooth scrolling para links de navegação
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");

    // 🔥 CORREÇÃO IMPORTANTE
    if (!href || href === "#") return;

    const target = document.querySelector(href);

    if (target) {
      e.preventDefault();
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Função para enviar confirmação por email
function sendEmailConfirmation(appointmentData) {
  // Formatar data para exibição
  const appointmentDate = formatarDataBR(appointmentData.date);

  // Criar conteúdo do email
  const emailContent = {
    to: appointmentData.email,
    subject: "✅ Confirmação de Agendamento - Dra. Andressa Odontologia",
    body: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
                        <div style="background-color: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 32px;">
                                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                                    <span style="color: white; font-size: 24px;">🦷</span>
                                </div>
                                <h1 style="color: #1f2937; margin: 0; font-size: 24px; font-weight: bold;">Dra. Andressa Odontologia</h1>
                                <p style="color: #6b7280; margin: 8px 0 0 0;">Cuidando do seu sorriso</p>
                            </div>
                            
                            <!-- Confirmação -->
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                                <h2 style="color: white; margin: 0 0 8px 0; font-size: 20px;">✅ Agendamento Recebido!</h2>
                                <p style="color: #d1fae5; margin: 0; font-size: 14px;">Sua solicitação foi enviada com sucesso</p>
                            </div>
                            
                            <!-- Dados do Agendamento -->
                            <div style="background-color: #f3f4f6; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                                <h3 style="color: #374151; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">📋 Detalhes do Agendamento</h3>
                                
                                <div style="display: grid; gap: 12px;">
                                    <div style="display: flex; align-items: center; padding: 8px 0;">
                                        <span style="color: #3b82f6; margin-right: 8px;">👤</span>
                                        <strong style="color: #374151; margin-right: 8px;">Paciente:</strong>
                                        <span style="color: #6b7280;">${
                                          appointmentData.name
                                        }</span>
                                    </div>
                                    
                                    <div style="display: flex; align-items: center; padding: 8px 0;">
                                        <span style="color: #3b82f6; margin-right: 8px;">🦷</span>
                                        <strong style="color: #374151; margin-right: 8px;">Tratamento:</strong>
                                        <span style="color: #6b7280;">${
                                          appointmentData.type
                                        }</span>
                                    </div>
                                    
                                    <div style="display: flex; align-items: center; padding: 8px 0;">
                                        <span style="color: #3b82f6; margin-right: 8px;">📅</span>
                                        <strong style="color: #374151; margin-right: 8px;">Data:</strong>
                                        <span style="color: #6b7280;">${appointmentDate}</span>
                                    </div>
                                    
                                    <div style="display: flex; align-items: center; padding: 8px 0;">
                                        <span style="color: #3b82f6; margin-right: 8px;">🕐</span>
                                        <strong style="color: #374151; margin-right: 8px;">Horário:</strong>
                                        <span style="color: #6b7280;">${
                                          appointmentData.time
                                        }</span>
                                    </div>
                                    
                                    <div style="display: flex; align-items: center; padding: 8px 0;">
                                        <span style="color: #3b82f6; margin-right: 8px;">📱</span>
                                        <strong style="color: #374151; margin-right: 8px;">Telefone:</strong>
                                        <span style="color: #6b7280;">${
                                          appointmentData.phone
                                        }</span>
                                    </div>
                                    
                                    ${
                                      appointmentData.notes
                                        ? `
                                    <div style="display: flex; align-items: flex-start; padding: 8px 0;">
                                        <span style="color: #3b82f6; margin-right: 8px;">📝</span>
                                        <strong style="color: #374151; margin-right: 8px;">Observações:</strong>
                                        <span style="color: #6b7280;">${appointmentData.notes}</span>
                                    </div>
                                    `
                                        : ""
                                    }
                                </div>
                            </div>
                            
                            <!-- Próximos Passos -->
                            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                                <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">📞 Próximos Passos</h3>
                                <ul style="color: #1e40af; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                                    <li>Nossa equipe entrará em contato em até <strong>24 horas</strong></li>
                                    <li>Confirmaremos a disponibilidade do horário solicitado</li>
                                    <li>Enviaremos instruções para preparação da consulta</li>
                                    <li>Caso necessário, ofereceremos horários alternativos</li>
                                </ul>
                            </div>
                            
                            <!-- Informações de Contato -->
                            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                                <h3 style="color: #374151; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📍 Informações da Clínica</h3>
                                
                                <div style="display: grid; gap: 8px; font-size: 14px;">
                                    <div style="color: #6b7280;">
                                        <strong style="color: #374151;">Endereço:</strong> Rua Miguel Langone, 296
                                    </div>
                                    <div style="color: #6b7280;">
                                        <strong style="color: #374151;">Telefone:</strong> (11) 3456-7890
                                    </div>
                                    <div style="color: #6b7280;">
                                        <strong style="color: #374151;">WhatsApp:</strong> (11) 99185-6447
                                    </div>
                                    <div style="color: #6b7280;">
                                        <strong style="color: #374151;">Email:</strong> contato@draandressa.com.br
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Botões de Ação -->
                            <div style="text-align: center; margin-bottom: 24px;">
                                <a href="https://wa.me/5511991856447?text=Olá! Recebi o email de confirmação do meu agendamento de ${
                                  appointmentData.type
                                } para ${appointmentDate} às ${
                                  appointmentData.time
                                }. Gostaria de confirmar." 
                                   style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 0 8px 8px 0;">
                                    💬 Falar no WhatsApp
                                </a>
                                
                                <a href="tel:+551134567890" 
                                   style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 0 8px 8px 0;">
                                    📞 Ligar Agora
                                </a>
                            </div>
                            
                            <!-- Política de Cancelamento -->
                            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                                <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">⚠️ Política de Cancelamento</h4>
                                <p style="color: #92400e; margin: 0; font-size: 12px; line-height: 1.5;">
                                    Cancelamentos devem ser feitos com pelo menos 24 horas de antecedência. 
                                    Cancelamentos de última hora podem estar sujeitos a cobrança.
                                </p>
                            </div>
                            
                            <!-- Footer -->
                            <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                                <p style="color: #9ca3af; margin: 0 0 8px 0; font-size: 12px;">
                                    Este é um email automático, não responda a esta mensagem.
                                </p>
                                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                                    © 2024 Dra. Andressa Odontologia - Todos os direitos reservados
                                </p>
                            </div>
                        </div>
                    </div>
                `,
  };
}

// Funções do WhatsApp
function toggleWhatsApp() {
  const menu = document.getElementById("whatsappMenu");
  menu.classList.toggle("hidden");
}

function sendWhatsAppMessage(telefone, message) {
  if (!telefone) {
    alert("Paciente sem telefone cadastrado");
    return;
  }

  if (!message) {
    alert("Mensagem não definida");
    return;
  }

  const numero = telefone.toString().replace(/\D/g, "");

  if (numero.length < 10) {
    alert("Telefone inválido");
    return;
  }

  const numeroCompleto = numero.startsWith("55") ? numero : "55" + numero;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${numeroCompleto}?text=${encodedMessage}`;

  window.open(whatsappUrl, "_blank");
}

// Função do Instagram
function openInstagram() {
  const instagramUrl = "https://www.instagram.com/Dra.andressapace";
  window.open(instagramUrl, "_blank");
}

// Fechar modais ao clicar fora
document.addEventListener("click", function (event) {
  const whatsappButton = document.getElementById("whatsappButton");
  const whatsappMenu = document.getElementById("whatsappMenu");
  const loginModal = document.getElementById("loginModal");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  // Fecha menu whatsapp clicando fora
  if (
    whatsappButton &&
    whatsappMenu &&
    !whatsappButton.contains(event.target)
  ) {
    whatsappMenu.classList.add("hidden");
  }

  // Fecha modal ao clicar no fundo (se quiser manter isso)
  if (loginModal && event.target === loginModal) {
    hideLogin();
  }

  // Fecha menu mobile ao clicar fora
  if (
    mobileMenuBtn &&
    mobileMenu &&
    !mobileMenuBtn.contains(event.target) &&
    !mobileMenu.contains(event.target)
  ) {
    mobileMenu.classList.add("hidden");
  }
});

// Fechar menu mobile ao clicar em links
document
  .querySelectorAll("#mobileMenu a, #mobileMenu button")
  .forEach((link) => {
    link.addEventListener("click", function () {
      document.getElementById("mobileMenu").classList.add("hidden");
    });
  });

// Funções do Sistema de Avaliações
function loadReviews() {
  if (!Array.isArray(reviews)) return;

  const reviewsGrid = document.getElementById("reviewsGrid");
  const loadMoreBtn = document.getElementById("loadMoreBtn");

  if (!reviewsGrid) return;

  let filteredReviews = reviews;

  // filtro por estrelas
  if (currentReviewFilter !== "all") {
    filteredReviews = reviews.filter(
      (review) => review.rating == currentReviewFilter,
    );
  }

  // ordenar por data
  filteredReviews.sort((a, b) =>
    b.data_avaliacao.localeCompare(a.data_avaliacao),
  );

  const reviewsToShow = filteredReviews.slice(0, reviewsDisplayed);

  reviewsGrid.innerHTML = reviewsToShow
    .map((review) => {
      const rating = Number(review.rating) || 0;

      const stars = "⭐".repeat(rating) + "☆".repeat(5 - rating);

      const reviewDate = review.data_avaliacao
        ? formatarDataSegura(review.data_avaliacao)
        : "";

      return `
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">

            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">

                    <div class="flex items-center space-x-2 mb-2">
                        <h3 class="font-semibold text-gray-900">${review.nome}</h3>
                    </div>

                    <div class="flex items-center space-x-2 mb-2">
                        <div class="text-yellow-400">${stars}</div>
                        <span class="text-sm text-gray-600">${rating}/5</span>
                    </div>

                    <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                        ${review.tratamento || ""}
                    </span>

                </div>
            </div>

            <p class="text-gray-700 mb-4 leading-relaxed">
                ${review.comentario || ""}
            </p>

            <div class="flex justify-between items-center text-sm text-gray-500">
                <span>${reviewDate}</span>
            </div>

        </div>
      `;
    })
    .join("");

  if (loadMoreBtn) {
    loadMoreBtn.style.display =
      reviewsToShow.length >= filteredReviews.length ? "none" : "block";
  }

  // atualizar contador total
  const totalReviews = document.getElementById("totalReviews");
  if (totalReviews) {
    totalReviews.textContent = reviews.length;
  }
}

function filterReviews(rating) {
  currentReviewFilter = rating;
  reviewsDisplayed = 6; // Reset para mostrar apenas os primeiros 6

  // Atualizar botões de filtro
  document.querySelectorAll('[id^="filter"]').forEach((btn) => {
    btn.className =
      "px-6 py-3 rounded-xl font-medium transition-colors text-gray-600 hover:text-gray-900";
  });

  const activeBtn = document.getElementById(
    `filter${rating === "all" ? "All" : rating}`,
  );
  if (activeBtn) {
    activeBtn.className =
      "px-6 py-3 rounded-xl font-medium transition-colors bg-blue-600 text-white";
  }

  loadReviews();
}

function loadMoreReviews() {
  reviewsDisplayed += 6;
  loadReviews();
}

// Event listeners para filtros de pacientes
document.addEventListener("DOMContentLoaded", function () {
  carregarAvaliacoes();
  // Carregar avaliações na inicialização

  // Adicionar event listeners quando os elementos existirem
  setTimeout(() => {
    const patientSearch = document.getElementById("patientSearch");
    const statusFilter = document.getElementById("statusFilter");

    if (patientSearch) {
      patientSearch.addEventListener("input", function () {
        if (currentAdminTab === "patients") {
          loadPatientsHistory();
        }
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener("change", function () {
        if (currentAdminTab === "patients") {
          loadPatientsHistory();
        }
      });
    }

    // Event listener para formulário de avaliação
  }, 100);
});

async function verificarSessao() {
  try {
    const res = await {
      credentials: "include",
      cache: "no-store",
    };

    if (!res.ok) throw new Error("Falha HTTP");

    const data = await res.json();

    // ---------- LOGADO ----------
    if (data.logado) {
      currentUser = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        tipo: data.tipo,
      };

      isAdmin = data.tipo === "admin";

      updateLoginButton(); // 🔥 CORRETO
      return true;
    }

    // ---------- NÃO LOGADO ----------
    currentUser = null;
    isAdmin = false;

    updateLoginButton(); // 🔥 CORRETO
    return false;
  } catch (e) {
    console.error("Erro ao verificar sessão:", e);
    return false;
  }
}

function atualizarMenuUsuario() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginBtnText = document.getElementById("loginBtnText");

  // se elementos não existem ainda, não executa
  if (!loginBtn || !logoutBtn || !loginBtnText) return;

  // ==========================
  // USUÁRIO LOGADO
  // ==========================
  if (currentUser && currentUser.nome) {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");

    // evita undefined
    loginBtnText.innerText = "👤 " + currentUser.nome;
  }
  // ==========================
  // NÃO LOGADO
  // ==========================
  else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");

    loginBtnText.innerText = "👤 Login";
  }
}
/* ENVIO DO AGENDAMENTO (AJAX) */
document.addEventListener("DOMContentLoaded", () => {
  const agendamentoForm = document.getElementById("agendamentoForm");

  if (!agendamentoForm) return;

  agendamentoForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!currentUser) {
      showMessage("Você precisa estar logado para agendar.", "error");
      showLogin();
      return;
    }

    const formData = new FormData(agendamentoForm);

    try {
      const res = await {
        method: "POST",
        credentials: "include",
        body: formData,
      };

      // 🔥 evita erro se o servidor retornar vazio
      const text = await res.text();

      if (!text || text.trim() === "") {
        console.error("Resposta vazia:", text);
        showMessage("Erro no servidor.", "error");
        return;
      }

      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Erro ao converter JSON:", text);
        showMessage("Erro inesperado do servidor.", "error");
        return;
      }

      if (data.sucesso) {
        showMessage("Agendamento solicitado com sucesso!", "success");

        // 🔥 DADOS DO FORMULÁRIO
        const appointmentData = {
          name: formData.get("nome"),
          email: currentUser.email, // ✅ CORRETO
          phone: formData.get("telefone"),
          type: formData.get("tipo_consulta"),
          date: formData.get("data"),
          time: formData.get("horario"),
          notes: formData.get("observacoes"),
        };
        console.log("ENVIANDO EMAIL:", appointmentData);

        // 🔥 ENVIA EMAIL
        if (typeof sendEmailConfirmation === "function") {
          sendEmailConfirmation(appointmentData);
        } else {
          console.warn("Função sendEmailConfirmation não encontrada");
        }

        agendamentoForm.reset();
      } else {
        showMessage(data.mensagem || "Erro ao solicitar agendamento.", "error");
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      showMessage("Erro ao conectar com o servidor.", "error");
    }
  });
});

async function carregarMeusAgendamentos(tabAtiva = "appointments") {
  try {
    const res = await {
      credentials: "include",
    };

    const data = await res.json();
    if (!data.sucesso) return;

    const container =
      tabAtiva === "history"
        ? document.getElementById("treatmentHistoryList")
        : document.getElementById("appointmentsList");

    if (!container) return;

    container.innerHTML = "";

    if (!data.agendamentos || data.agendamentos.length === 0) {
      container.innerHTML = `
        <p class="text-gray-500 text-center">
          Nenhum agendamento encontrado
        </p>`;
      return;
    }

    const proximos = data.agendamentos.filter((ag) => {
      const status = (ag.status || "").trim().toLowerCase();
      return ["pendente", "confirmado"].includes(status);
    });

    const historico = data.agendamentos.filter((ag) => {
      const status = (ag.status || "").trim().toLowerCase();
      return ["realizado", "cancelado"].includes(status);
    });

    function getStatusBadge(status) {
      const s = (status || "").toLowerCase();

      if (s === "confirmado")
        return `<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Confirmado</span>`;

      if (s === "pendente")
        return `<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pendente</span>`;

      if (s === "cancelado")
        return `<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Cancelado</span>`;

      if (s === "realizado")
        return `<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Realizado</span>`;

      return `<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">${status}</span>`;
    }

    const listaParaRenderizar = tabAtiva === "history" ? historico : proximos;

    if (listaParaRenderizar.length === 0) {
      container.innerHTML = `
        <p class="text-gray-500 text-center">
          Nenhum agendamento encontrado
        </p>`;
      return;
    }

    listaParaRenderizar.forEach((ag) => {
      const status = (ag.status || "").trim().toLowerCase();
      const card = document.createElement("div");
      card.className = "bg-white p-4 rounded-xl shadow mb-4 border";
      card.setAttribute("data-agendamento-id", ag.id);

      card.innerHTML = `
        <div class="font-semibold text-lg ${
          tabAtiva === "history" ? "text-gray-700" : "text-blue-600"
        }">
          ${ag.tipo_consulta}
        </div>

        <div>
  📅 <span class="appointment-date">${ag.data}</span>
  às
  <span class="appointment-time">${ag.horario}</span>
</div>

        <div class="mt-2">${getStatusBadge(ag.status)}</div>

        ${
          ag.observacoes ? `<div class="mt-2">Obs: ${ag.observacoes}</div>` : ""
        }

        ${
          tabAtiva === "appointments" &&
          (status === "pendente" || status === "confirmado")
            ? `
          <div class="mt-4 flex gap-3">

            <button 
              onclick="showChangeDateModal(${ag.id})"
              class="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition text-sm">
              Alterar Data
            </button>

            ${
              status === "pendente"
                ? `
              <button 
                onclick="cancelarAgendamento(${ag.id})"
                class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm">
                Cancelar
              </button>
              `
                : ""
            }

          </div>
        `
            : ""
        }
      `;

      container.appendChild(card);
    });
  } catch (e) {
    console.error(e);
  }
}

async function cancelarAgendamento(id) {
  if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;

  try {
    const res = await {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    };

    const data = await res.json();

    if (data.sucesso) {
      showAlert("Agendamento cancelado com sucesso!");
      carregarMeusAgendamentos(currentPatientTab);
    } else {
      showAlert(data.mensagem || "Erro ao cancelar", "error");
    }
  } catch (e) {
    console.error(e);
    showAlert("Erro ao conectar com o servidor.", "error");
  }
}
/* ===========================
   LOGIN DO DOUTOR
=========================== */

const adminLoginForm = document.getElementById("adminForm");

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(adminLoginForm);

    try {
      const res = await {
        method: "POST",
        body: formData,
        credentials: "include",
      };

      const data = await res.json();

      if (data.sucesso) {
        // sincroniza sessão com PHP
        await verificarSessao();
        updateLoginButton();
        // fecha modal
        hideLogin();

        if (isAdmin) {
          // mostra painel admin
          document.getElementById("adminDashboard")?.classList.remove("hidden");

          document.getElementById("patientDashboard")?.classList.add("hidden");

          // 🔥 carrega dados imediatamente
          await loadAdminData();
        }
      } else {
        showAlert(data.mensagem || "Email ou senha incorretos.", "warning");
      }
    } catch (err) {
      console.error(err);
      showAlert("Erro ao conectar com o servidor.", "error");
    }
  });
}

function mostrarAdminDashboard(nome) {
  // fecha login
  document.getElementById("loginModal")?.classList.add("hidden");

  // abre painel admin
  document.getElementById("adminDashboard")?.classList.remove("hidden");

  // MOSTRA SEMPRE OS DOIS BOTÕES
  document.getElementById("loginBtn")?.classList.remove("hidden");
  document.getElementById("logoutBtn")?.classList.remove("hidden");

  // nome
  const welcome = document.getElementById("adminWelcome");
  if (welcome && nome) {
    welcome.innerText = "Bem-vindo(a), Dr(a). " + nome + "!";
  }
}

document.addEventListener("DOMContentLoaded", iniciarSistema);

async function iniciarSistema() {
  const logado = await verificarSessao();
  if (!logado) return;

  // 🔥 ADMIN
  if (isAdmin) {
    document.getElementById("adminDashboard")?.classList.remove("hidden");
    document.getElementById("patientDashboard")?.classList.add("hidden");

    loadAdminData(); // 👈 FALTAVA ISSO
    return;
  }

  // 🔹 PACIENTE
  if (currentUser) {
    if (typeof showDashboard === "function") {
      showDashboard();
    }

    if (typeof switchPatientTab === "function") {
      switchPatientTab("appointments");
    }
  }
}

const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    const logado = await verificarSessao();

    // NÃO LOGADO → abre login
    if (!logado) {
      showLogin();
      return;
    }

    // ADMIN
    if (isAdmin) {
      document.getElementById("adminDashboard")?.classList.remove("hidden");
      document.getElementById("patientDashboard")?.classList.add("hidden");
      return;
    }

    // PACIENTE
    showDashboard();
    switchPatientTab("appointments");
  });
}

function showChangeDateModal(id) {
  selectedAppointmentId = id;

  // Limpa campos ao abrir
  const dateInput = document.getElementById("newDate");
  const timeInput = document.getElementById("newTime");

  if (dateInput) dateInput.value = "";
  if (timeInput) timeInput.value = "";

  const modal = document.getElementById("changeDateModal");
  if (modal) modal.classList.remove("hidden");
}

function hideChangeDateModal() {
  const modal = document.getElementById("changeDateModal");
  if (modal) modal.classList.add("hidden");
}

document
  .getElementById("changeDateForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const newDate = document.getElementById("newDate")?.value;
    const newTime = document.getElementById("newTime")?.value;

    if (!selectedAppointmentId || !newDate || !newTime) {
      showAlert("Selecione data e horário.", "warning");
      return;
    }

    try {
      const response = await {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: selectedAppointmentId,
          data: newDate,
          horario: newTime,
        }),
      };

      const text = await response.text();

      if (!text) {
        showAlert("Resposta vazia do servidor", "error");
        return;
      }

      let result;

      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("Erro JSON:", text);
        showAlert("Erro no servidor", "error");
        return;
      }

      if (result.sucesso) {
        hideChangeDateModal();

        // 🔥 Atualiza o card imediatamente na tela
        const cards = document.querySelectorAll("[data-agendamento-id]");

        cards.forEach((card) => {
          if (card.dataset.agendamentoId == selectedAppointmentId) {
            const dateEl = card.querySelector(".appointment-date");
            const timeEl = card.querySelector(".appointment-time");

            if (dateEl) dateEl.textContent = newDate;
            if (timeEl) timeEl.textContent = newTime;
          }
        });

        // 🔄 também recarrega do banco
        carregarMeusAgendamentos();

        // 🔥 verifica se é painel admin
        const isAdminPanel =
          document.getElementById("adminAppointmentsList") !== null;

        if (isAdminPanel) {
          await loadAdminData(); // atualiza painel admin
        } else {
          await carregarMeusAgendamentos("appointments"); // atualiza lista principal
          await carregarMeusAgendamentos("history"); // atualiza histórico também
        }
      } else {
        showAlert(result.mensagem || "Erro ao alterar agendamento.", "error");
      }
    } catch (error) {
      console.error("Erro:", error);
      showAlert("Erro ao conectar com o servidor.", "error");
    }
  });

document.addEventListener("DOMContentLoaded", function () {
  function configurarBloqueioData(dateId, timeId) {
    const dateInput = document.getElementById(dateId);
    const timeSelect = document.getElementById(timeId);

    if (!dateInput || !timeSelect) return;

    const hoje = new Date();
    const hojeFormatado = hoje.toISOString().split("T")[0];
    dateInput.min = hojeFormatado;

    dateInput.addEventListener("change", function () {
      if (!this.value) return;

      const dataSelecionada = new Date(this.value + "T00:00:00");

      // bloquear domingo
      if (dataSelecionada.getDay() === 0) {
        showAlert("Não realizamos atendimentos aos domingos.", "warning");
        this.value = "";
        return;
      }

      const agora = new Date();
      const horaAtual = agora.getHours();
      const minutoAtual = agora.getMinutes();

      const horarios = timeSelect.querySelectorAll("option");

      horarios.forEach((option) => {
        option.disabled = false;

        if (!option.value) return;

        const [hora, minuto] = option.value.split(":").map(Number);

        if (dataSelecionada.toDateString() === agora.toDateString()) {
          if (
            hora < horaAtual ||
            (hora === horaAtual && minuto <= minutoAtual)
          ) {
            option.disabled = true;
          }
        }
      });

      timeSelect.value = "";
    });
  }

  // aplicar no agendamento principal
  configurarBloqueioData("appointmentDate", "appointmentTime");

  // aplicar no modal
  configurarBloqueioData("newDate", "newTime");
});

document.addEventListener("DOMContentLoaded", function () {
  async function atualizarHorarios(dateInputId, selectId) {
    const dateInput = document.getElementById(dateInputId);
    const select = document.getElementById(selectId);

    if (!dateInput || !select) return;

    dateInput.addEventListener("change", async function () {
      const selectedDate = this.value;
      if (!selectedDate) return;

      try {
        const ocupados = await res.json();

        console.log("Horários ocupados:", ocupados);

        const options = select.querySelectorAll("option");

        const agora = new Date();
        const hoje = agora.toISOString().split("T")[0];
        const horaAtual = agora.getHours();
        const minutoAtual = agora.getMinutes();

        options.forEach((option) => {
          if (!option.value) return;

          const [hora, minuto] = option.value.split(":").map(Number);

          const horarioPassou =
            selectedDate === hoje &&
            (hora < horaAtual || (hora === horaAtual && minuto <= minutoAtual));

          if (ocupados.includes(option.value) || horarioPassou) {
            option.disabled = true;
            option.textContent = option.value + " (Indisponível)";
          } else {
            option.disabled = false;
            option.textContent = option.value;
          }
        });
      } catch (err) {
        console.error("Erro ao carregar horários:", err);
      }
    });
  }

  // formulário de agendamento
  atualizarHorarios("appointmentDate", "appointmentTime");

  // modal de alterar horário
  atualizarHorarios("newDate", "newTime");
});

function showAlert(message, type = "success") {
  const alertBox = document.getElementById("siteAlert");

  if (!alertBox) return;

  alertBox.textContent = message;

  // cores
  alertBox.classList.remove(
    "hidden",
    "bg-green-600",
    "bg-red-600",
    "bg-yellow-500",
  );

  if (type === "error") {
    alertBox.classList.add("bg-red-600");
  } else if (type === "warning") {
    alertBox.classList.add("bg-yellow-500");
  } else {
    alertBox.classList.add("bg-green-600");
  }

  alertBox.classList.remove("hidden");

  setTimeout(() => {
    alertBox.classList.add("hidden");
  }, 3500);
}

document.addEventListener("DOMContentLoaded", async () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
  const mobileLoginBtn = document.getElementById("mobileLoginBtn");
  const loginBtn = document.getElementById("loginBtn"); // 🔥 FALTAVA ISSO

  // 🔥 VERIFICA SESSÃO AO CARREGAR
  await verificarSessao();
  updateLoginButton();

  // LOGOUT
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", handleLogout);
  }

  // 🔥 LOGIN MOBILE
  if (mobileLoginBtn) {
    mobileLoginBtn.addEventListener("click", async () => {
      const logado = await verificarSessao();

      if (logado) {
        if (isAdmin) {
          document.getElementById("adminDashboard")?.classList.remove("hidden");
          document.getElementById("patientDashboard")?.classList.add("hidden");
          await loadAdminData();
        } else {
          showDashboard();
        }
      } else {
        showLogin();
      }
    });
  }

  // 🔥 LOGIN DESKTOP (CORREÇÃO)
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const logado = await verificarSessao();

      if (logado) {
        if (isAdmin) {
          document.getElementById("adminDashboard")?.classList.remove("hidden");
          document.getElementById("patientDashboard")?.classList.add("hidden");
          await loadAdminData();
        } else {
          showDashboard();
        }
      } else {
        showLogin();
      }
    });
  }
});
function showForgotPassword() {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.add("hidden");
  document.getElementById("forgotForm").classList.remove("hidden");
}

document
  .getElementById("forgotForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("forgotEmail").value;

    try {
      const res = await {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      };

      const data = await res.json();

      if (data.sucesso) {
        showMessage("📧 Email de recuperação enviado!", "success");
      } else {
        showMessage(data.mensagem || "Erro ao enviar email", "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("Erro no servidor", "error");
    }
  });
