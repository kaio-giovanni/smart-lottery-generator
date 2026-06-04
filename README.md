# Smart Lottery Generator 🎰

An advanced, client-side web application designed to generate optimized combinations for Brazilian lotteries (**Lotofácil** and **Mega-Sena**). Built with pure Vanilla JS and structured using dynamic configuration patterns, this tool allows users to apply mathematical filters and statistical constraints through an intuitive, interactive betting board.

Live Demo: [https://kaio-giovanni.github.io/smart-lottery-generator](https://kaio-giovanni.github.io/smart-lottery-generator)

## 🚀 Features

- **Multi-Game Support (Polymorphic Architecture):** Easily toggle between Lotofácil and Mega-Sena. The UI layout, grid constraints, and mathematical rules update dynamically.
- **Interactive Betting Board (UX/UI):** Clickable matrix grid where users can cycle numbers through three states:
  - **Neutral (Gray):** Standard pool numbers.
  - **Fixed/Obligatory (Green):** Numbers that *must* be included in every generated game.
  - **Excluded/Blocked (Red):** Numbers that *cannot* appear in any generated game.
- **Advanced Statistical Filters:**
  - **Even/Odd Balance:** Forces combinations to respect historical probability ratios.
  - **Border Optimization:** Validates drafts against the most frequent perimeter patterns on the physical card.
  - **Consecutive Number/Streak Control:** Restricts long sequential blocks, keeping streaks within realistic probability thresholds.
- **Combinatorial Safety Lock:** Computes the mathematical maximum possible combinations (`nCr`) in real-time based on your filters to prevent infinite runtime loops.

## 🛠️ Tech Stack & Best Practices

- **HTML5:** Semantic architecture.
- **CSS3:** Modern CSS Grid configuration, responsive layout, and runtime CSS custom properties (variables) for theme-switching.
- **Vanilla JavaScript (ES6+):** Component-free state management using Javascript `Map` and `Set` structures. Fully documented and coded in English following industry standard naming conventions (UI renders in Portuguese).
- **Zero Dependencies:** No npm packages, no build steps, lightweight, and ultra-fast loading times.

## 📂 Project Structure

```text
├── index.html     # Application layout and semantic structure
├── style.css      # Responsive styles and layout transitions
└── script.js      # Combinatorics engine and state management
