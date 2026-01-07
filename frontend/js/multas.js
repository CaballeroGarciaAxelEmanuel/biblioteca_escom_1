function configurarBusquedaMateriales() {
    const input = document.getElementById('material_search');
    const results = document.getElementById('search_results');
    const hiddenId = document.getElementById('material_id');

    let timeout = null;

    input.addEventListener('input', () => {
        const termino = input.value.trim();

        if (timeout) clearTimeout(timeout);

        if (termino.length < 2) {
            results.style.display = 'none';
            hiddenId.value = '';
            return;
        }

        timeout = setTimeout(async () => {
            try {
                const res = await fetch(
                    `${API_URL}/api/materiales/buscar?q=${encodeURIComponent(termino)}`
                );
                const data = await res.json();

                results.innerHTML = '';

                if (!data.success || data.materiales.length === 0) {
                    results.innerHTML = '<div class="search-item">Sin resultados</div>';
                    results.style.display = 'block';
                    return;
                }

                data.materiales.forEach(mat => {
                    const div = document.createElement('div');
                    div.className = 'search-item';
                    div.textContent = `${mat.titulo} — ${mat.autor}`;

                    div.onclick = () => {
                        input.value = mat.titulo;
                        hiddenId.value = mat.id;
                        results.innerHTML = '';
                        results.style.display = 'none';
                    };

                    results.appendChild(div);
                });

                results.style.display = 'block';

            } catch (err) {
                console.error('Error buscando materiales:', err);
                results.style.display = 'none';
            }
        }, 300);
    });
}
