// Test básico de conectividad
const testConnectivity = async () => {
  console.log("🔧 Probando conectividad básica...");

  try {
    // Test 1: Conectividad a internet
    console.log("1. Probando conectividad a internet...");
    const internetTest = await fetch("https://httpbin.org/ip", {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    console.log("✅ Internet OK:", await internetTest.json());
  } catch (error) {
    console.error("❌ Sin internet:", error.message);
    return;
  }

  try {
    // Test 2: Conectividad a Supabase URL
    console.log("2. Probando conectividad a Supabase...");
    const supabaseUrl = "https://sqxqhpqfxncxvphymnlf.supabase.co";
    const supabaseTest = await fetch(supabaseUrl + "/rest/v1/", {
      method: "GET",
      headers: {
        apikey:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeHFocHFmeG5jeHZwaHltbmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMzgwNzMsImV4cCI6MjA0ODkxNDA3M30.c0lJhIK7wcrH6vJCBJKM2pU2kAzgv-1YyqvQLhxD2Go",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (supabaseTest.ok) {
      console.log("✅ Supabase alcanzable");
    } else {
      console.error(
        "❌ Supabase error:",
        supabaseTest.status,
        supabaseTest.statusText,
      );
    }
  } catch (error) {
    console.error("❌ Error conectando a Supabase:", error.message);
  }

  try {
    // Test 3: Query simple
    console.log("3. Probando query simple...");
    const queryTest = await fetch(
      "https://sqxqhpqfxncxvphymnlf.supabase.co/rest/v1/employees?select=count&head=true",
      {
        method: "HEAD",
        headers: {
          apikey:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeHFocHFmeG5jeHZwaHltbmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMzgwNzMsImV4cCI6MjA0ODkxNDA3M30.c0lJhIK7wcrH6vJCBJKM2pU2kAzgv-1YyqvQLhxD2Go",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeHFocHFmeG5jeHZwaHltbmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMzgwNzMsImV4cCI6MjA0ODkxNDA3M30.c0lJhIK7wcrH6vJCBJKM2pU2kAzgv-1YyqvQLhxD2Go",
        },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (queryTest.ok) {
      console.log("✅ Query test OK");
      console.log("Count header:", queryTest.headers.get("Content-Range"));
    } else {
      console.error(
        "❌ Query test failed:",
        queryTest.status,
        queryTest.statusText,
      );
    }
  } catch (error) {
    console.error("❌ Error en query test:", error.message);
  }

  console.log("🎯 Test de conectividad completado");
};

// Test automático
testConnectivity();

// Hacer disponible globalmente
window.testConnectivity = testConnectivity;
console.log("🔧 testConnectivity() function available");
