sed -i 's/Globe, Upload, Download, Sparkles, Layers,/Globe, Upload, Download, Sparkles, Layers, Moon, Sun,/g' src/components/Navbar.tsx

sed -i '/const \[publishSuccess, setPublishSuccess\] = useState(false);/a\
  const [isDarkMode, setIsDarkMode] = React.useState(false);\
  React.useEffect(() => {\
    if (localStorage.theme === "dark" || (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)) {\
      setIsDarkMode(true);\
      document.documentElement.classList.add("dark");\
    } else {\
      setIsDarkMode(false);\
      document.documentElement.classList.remove("dark");\
    }\
  }, []);\
  const toggleDarkMode = () => {\
    if (isDarkMode) {\
      document.documentElement.classList.remove("dark");\
      localStorage.theme = "light";\
      setIsDarkMode(false);\
    } else {\
      document.documentElement.classList.add("dark");\
      localStorage.theme = "dark";\
      setIsDarkMode(true);\
    }\
  };' src/components/Navbar.tsx
