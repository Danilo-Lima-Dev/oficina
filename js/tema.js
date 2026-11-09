/* aplica o tema salvo antes de desenhar a tela, sem piscar */
try{var t=localStorage.getItem("tapecaria_tema");if(t==="claro")document.documentElement.dataset.theme="light";else if(t==="escuro")document.documentElement.dataset.theme="dark"}catch(e){}
