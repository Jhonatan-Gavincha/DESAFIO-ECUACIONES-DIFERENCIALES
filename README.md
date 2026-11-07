# ¿Se respira bien en nuestro salón? Modelo del CO₂ en el aula con EDO

**Desafío individual de Métodos Numéricos · 2026**
**Estudiante:** [Tu nombre completo]
**Materia:** Métodos Numéricos

- **Aplicación web:** [pega aquí el enlace público]
- **Video (1 min):** [pega aquí el enlace del video]
- **Repositorio:** [pega aquí el enlace de este repositorio]

> Todos los parámetros son **hipotéticos**. La simulación ilustra el fenómeno, no es una predicción comprobada con mediciones.

---

## a) Problema y contexto

En un aula cerrada, el CO₂ que exhalamos se acumula. Por encima de **1000 ppm** (referencia habitual de calidad del aire interior) aparecen cansancio y dificultad para concentrarse. Esto afecta a estudiantes y docentes, que pasan horas en el mismo salón.

**Población beneficiaria:** estudiantes y docentes de un curso.

**Pregunta del desafío:** ¿en cuántos minutos se supera el límite de 1000 ppm en un salón y cuánta ventilación hace falta para no pasarlo?

## b) Modelo matemático

Variable dependiente: C(t), concentración de CO₂ en el aula (ppm). Variable independiente: t, tiempo (min).

$$\frac{dC}{dt} = a - \lambda\,(C - C_{ext}), \qquad C(0) = C_0$$

con

$$a = \frac{1000\,N\,g}{V}\ \text{(ppm/min)}, \qquad \lambda = \frac{Q}{V}\ \text{(1/min)}$$

El término *a* es el CO₂ que generan las personas y λ indica qué tan rápido se renueva el aire.

**Supuestos:** el aire del aula se mezcla bien; el número de estudiantes y la ventilación son constantes; el CO₂ exterior es constante; la única fuente de CO₂ son las personas.

| Parámetro | Unidad | Valor base | Justificación |
|---|---|---|---|
| N, estudiantes | personas | 30 | Curso típico |
| g, CO₂ por persona | L/min | 0,3 | Orden de magnitud de una persona sentada |
| V, volumen | m³ | 144 | Aula de 6 × 8 × 3 m |
| Q, ventilación | m³/min | 6 | Ventanas entreabiertas (≈ 2,5 renovaciones/h) |
| C_ext, CO₂ exterior | ppm | 420 | Aire libre típico |
| C₀, CO₂ inicial | ppm | 420 | Aula ventilada antes de empezar |
| T, h | min | 60 y 5 | Una hora de clase y paso de 5 min |

Intervalo de simulación: t ∈ [0, 60] min.

## c) Solución analítica

La EDO es lineal. Con $C_\infty = C_{ext} + \dfrac{a}{\lambda}$:

$$C(t) = C_\infty + (C_0 - C_\infty)\,e^{-\lambda t}$$

**Verificación por sustitución.** Al derivar:

$$C'(t) = -\lambda (C_0 - C_\infty)e^{-\lambda t} = -\lambda\,(C - C_\infty) = a - \lambda\,(C - C_{ext})$$

porque $\lambda C_\infty = \lambda C_{ext} + a$. Además, $C(0) = C_\infty + C_0 - C_\infty = C_0$. Si Q = 0 (λ = 0), la solución es $C(t) = C_0 + a\,t$.

**Tiempo hasta el límite** (cuando $C_\infty > 1000$ y $C_0 < 1000$):

$$t^* = \frac{1}{\lambda}\,\ln\!\left(\frac{C_\infty - C_0}{C_\infty - 1000}\right)$$

Con los valores base: a = 62,5 ppm/min, λ = 0,0417 1/min, C∞ = 1920 ppm y **t\* ≈ 11,73 min**.

## d) Métodos numéricos

Con f(t, C) = a − λ(C − C_ext), ambos métodos usan los mismos parámetros, intervalo y paso h.

**Heun (RK2):**

$$k_1 = f(t_n, C_n),\quad k_2 = f(t_n + h,\ C_n + h k_1),\quad C_{n+1} = C_n + \frac{h}{2}(k_1 + k_2)$$

**Runge-Kutta de 4.º orden (RK4):**

$$C_{n+1} = C_n + \frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)$$

con $k_1 = f(t_n, C_n)$, $k_2 = f(t_n + \tfrac{h}{2}, C_n + \tfrac{h}{2}k_1)$, $k_3 = f(t_n + \tfrac{h}{2}, C_n + \tfrac{h}{2}k_2)$ y $k_4 = f(t_n + h, C_n + h k_3)$.

## e) Comparación con la solución analítica

Error absoluto máximo en [0, 60] min con los valores base:

| h (min) | Heun (ppm) | RK4 (ppm) |
|---|---|---|
| 5 | 4,683 | 0,0103 |
| 2,5 | 1,079 | 0,00059 |
| 1,25 | 0,2595 | 0,0000353 |

Al reducir h a la mitad, el error de Heun baja unas 4 veces (orden 2) y el de RK4 unas 16 veces (orden 4). La aplicación muestra además la tabla por pasos, la gráfica de las tres soluciones, el error absoluto y el error relativo %.

## f) Interpretación y conclusiones

**Escenarios de ventilación** (30 estudiantes, 144 m³, C₀ = 420 ppm):

| Escenario | Renov./h | Q (m³/min) | CO₂ estable (ppm) | Minutos hasta 1000 ppm |
|---|---|---|---|---|
| Ventanas cerradas | 0,6 | 1,44 | 6670 | 9,7 |
| Entreabiertas | 2,5 | 6,0 | 1920 | 11,7 |
| Ventanas y puerta abiertas | 8 | 19,2 | 889 | No lo supera |

1. **Respuesta a la pregunta.** Con estos supuestos, el límite se supera a los 9,7 min con ventanas cerradas y a los 11,7 min con ventanas entreabiertas. Para no pasar de 1000 ppm hacen falta al menos **15,5 m³/min** de aire fresco.
2. **Recomendación para el salón.** Entreabrir las ventanas casi no gana tiempo. Lo que mantiene el aire bajo el límite es abrir ventanas y puerta desde antes de empezar y durante toda la clase. Si solo se pueden entreabrir, conviene hacer una pausa de ventilación antes de los 9 min. Con la ventilación base (6 m³/min), el aire se mantendría bajo el límite con hasta unas 11 personas.
3. **Qué método fue mejor.** RK4 tuvo menos error en todos los ensayos y mejora mucho más rápido al reducir h. Para este problema ambos son suficientes, pero RK4 permite pasos más grandes con precisión similar.
4. **Limitaciones.** Los parámetros son hipotéticos y el modelo supone aire bien mezclado y ventilación constante. Para usarlo como diagnóstico real habría que medir el CO₂ del aula con un sensor y ajustar g y Q con esos datos.

## Cómo usar la aplicación

La aplicación son tres archivos estáticos (`index.html`, `style.css` y `script.js`), sin dependencias que instalar. Basta con abrir `index.html` en cualquier navegador, o publicarla con GitHub Pages. La tipografía se carga desde Google Fonts y, sin internet, se usa una fuente del sistema.

1. Cambia los parámetros en el panel (estudiantes, volumen, ventilación, C₀, T y h).
2. Revisa el tiempo hasta 1000 ppm, las gráficas y las tablas de errores.
3. Compara los escenarios de ventilación y lee las conclusiones, que se recalculan con tus valores.
4. Pulsa **Guardar simulación** para almacenarla en el historial. Desde ahí puedes cargarla de nuevo, borrarla o exportar todo a CSV.

## Almacenamiento de datos

La aplicación guarda las simulaciones en el navegador con **localStorage** (clave `co2_aula_historial_v1`), sin servidor ni registro. Cada registro contiene:

| Grupo | Campos |
|---|---|
| Identificación | Nombre del escenario, fecha y hora |
| Parámetros de entrada | Estudiantes, CO₂ por persona, volumen, ventilación, CO₂ exterior, C₀, T y h |
| Resultados | Minutos hasta 1000 ppm, CO₂ final, ventilación mínima, aforo máximo, error máximo de Heun y de RK4 |

No se guardan las curvas, porque se recalculan a partir de los parámetros. Los datos viven solo en el navegador de quien usa la app, y el botón **Exportar CSV** permite llevarlos a una hoja de cálculo.

## Estructura del repositorio

```
index.html   Estructura de la página y contenido
style.css    Estilos (tema claro y oscuro, portada, tablas, gráficas)
script.js    Modelo, métodos de Heun y RK4, gráficas, escenarios e historial
README.md    Informe del desafío (incisos a a f)
```
