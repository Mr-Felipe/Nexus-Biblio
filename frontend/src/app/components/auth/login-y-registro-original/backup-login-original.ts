/**
 * ============================================================
 * ARCHIVO DE RESPALDO - Métodos de Login/Registro Originales
 * Fecha: Antes del 24/07/2026
 * Descripción: Métodos originales de login/registro que estaban
 * integrados en app.ts antes de ser extraídos a un componente
 * separado.
 * ============================================================
 * 
 * ESTE ARCHIVO ES SOLO PARA REFERENCIA - NO SE USA EN LA APLICACIÓN
 * 
 * Los métodos originales que estaban en app.ts:
 */

// ============================================
// MÉTODOS ORIGINALES DE app.ts (ELIMINADOS)
// ============================================

/*
  // Register form
  showRegisterForm = signal(false);

  // Password toggle
  showPassword = signal(false);

  // Form group definitions
  loginForm = new FormGroup({
    id: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    password: new FormControl('', { validators: [Validators.required], nonNullable: true }),
  });

  registerForm = new FormGroup({
    id: new FormControl('', { validators: [Validators.required, Validators.pattern(/^\d+$/)], nonNullable: true }),
    name: new FormControl('', { validators: [Validators.required, Validators.minLength(3)], nonNullable: true }),
    email: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    password: new FormControl('', { validators: [Validators.required, Validators.minLength(4)], nonNullable: true }),
    role: new FormControl<'DOC' | 'EST'>('EST', { validators: [Validators.required], nonNullable: true }),
  });

  ngOnInit() {
    // Sync active login credentials if any helper is clicked
    this.loginForm.setValue({ id: '', password: '' });
  }

  // Set pre-defined login user
  useCredentials(id: string, role: string) {
    const password =
      role === 'ADMIN'
        ? 'admin123'
        : role === 'BIBL'
        ? 'biblio123'
        : role === 'DOC'
        ? 'docente123'
        : 'estudiante123';
    this.loginForm.setValue({ id, password });
    this.showToast('info', `Cargadas credenciales para el rol de ${role}. Presiona "Ingresar"`);
  }

  openRegisterForm() {
    this.registerForm.reset({ id: '', name: '', email: '', password: '', role: 'EST' });
    this.showRegisterForm.set(true);
  }

  registerUser() {
    if (this.registerForm.invalid) {
      this.showToast('error', 'Por favor, rellene todos los campos correctamente.');
      return;
    }
    const raw = this.registerForm.getRawValue();

    // Check duplicate ID
    const exists = this.state.users().some((u) => u.id === raw.id);
    if (exists) {
      this.showToast('error', `Ya existe un usuario con el ID ${raw.id}`);
      return;
    }

    this.state.addUser({
      id: raw.id,
      name: raw.name,
      email: raw.email,
      role: raw.role,
      password: raw.password,
    });

    // Also create the password mapping by storing it in localStorage
    const passwordMap = JSON.parse(localStorage.getItem('biblio_passwords') || '{}');
    passwordMap[raw.id] = raw.password;
    localStorage.setItem('biblio_passwords', JSON.stringify(passwordMap));

    this.showToast('success', '¡Registro exitoso! Ya puedes iniciar sesión con tus credenciales.');
    this.showRegisterForm.set(false);
    this.loginForm.setValue({ id: raw.id, password: '' });
  }

  // Handlers
  onLoginSubmit() {
    if (this.loginForm.invalid) {
      this.showToast('error', 'Por favor ingresa ID y contraseña válidos.');
      return;
    }
    const { id, password } = this.loginForm.getRawValue();
    const success = this.state.login(id, password);
    if (success) {
      this.showToast('success', `¡Bienvenido de nuevo, ${this.state.currentUser()?.name}!`);
      this.loginForm.reset();
    } else {
      this.showToast('error', 'Credenciales inválidas o usuario inactivo.');
    }
  }
*/
