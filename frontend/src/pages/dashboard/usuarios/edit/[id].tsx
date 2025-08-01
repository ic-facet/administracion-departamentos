import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import API from "@/api/axiosConfig";
import {
	TextField,
	Button,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Grid,
	Paper,
	Typography,
	Alert,
	CircularProgress,
	Switch,
	FormControlLabel,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Swal from "sweetalert2";
import DashboardMenu from "../..";
import withAuth from "../../../../components/withAut";
import { API_BASE_URL } from "../../../../utils/config";
import "./styles.css";
import BasicModal from "../../../../utils/modal";

interface Rol {
	id: number;
	descripcion: string;
}

interface Usuario {
	id: number;
	email: string;
	nombre: string;
	apellido: string;
	legajo: number;
	documento: number;
	rol: number;
	rol_detalle: string;
	is_active: boolean;
	has_changed_password: boolean;
}

const EditarUsuario = () => {
	const router = useRouter();
	const { id } = router.query;
	const [loading, setLoading] = useState(false);
	const [loadingData, setLoadingData] = useState(true);
	const [roles, setRoles] = useState<Rol[]>([]);
	const [usuario, setUsuario] = useState<Usuario | null>(null);
	const [formData, setFormData] = useState({
		email: "",
		nombre: "",
		apellido: "",
		legajo: "",
		documento: "",
		rol: "",
		is_active: true,
	});
	const [errors, setErrors] = useState<{ [key: string]: string }>({});

	const fetchRoles = useCallback(async () => {
		try {
			const response = await API.get(`/facet/roles/`);
			console.log("Respuesta de roles:", response.data);
			setRoles(
				Array.isArray(response.data) ? response.data : response.data.results
			);
		} catch (error) {
			console.error("Error al cargar roles:", error);
			Swal.fire({
				icon: "error",
				title: "Error",
				text: "No se pudieron cargar los roles.",
			});
		}
	}, []);

	const fetchUsuario = useCallback(async () => {
		try {
			const response = await API.get(`/facet/users/${id}/`);
			const userData = response.data;
			setUsuario(userData);
			setFormData({
				email: userData.email || "",
				nombre: userData.nombre || "",
				apellido: userData.apellido || "",
				legajo: userData.legajo?.toString() || "",
				documento: userData.documento?.toString() || "",
				rol:
					(userData.rol && typeof userData.rol === "number"
						? userData.rol.toString()
						: "") || "",
				is_active: userData.is_active,
			});
		} catch (error) {
			console.error("Error al cargar usuario:", error);
			Swal.fire({
				icon: "error",
				title: "Error",
				text: "No se pudo cargar la información del usuario.",
			}).then(() => {
				router.push("/dashboard/usuarios");
			});
		} finally {
			setLoadingData(false);
		}
	}, [id, router]);

	useEffect(() => {
		if (id) {
			fetchRoles();
			fetchUsuario();
		}
	}, [id, fetchRoles, fetchUsuario]);

	const validateForm = () => {
		const newErrors: { [key: string]: string } = {};

		// Validar email
		if (!formData.email) {
			newErrors.email = "El email es requerido";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "El email no es válido";
		}

		// Validar nombre
		if (!formData.nombre) {
			newErrors.nombre = "El nombre es requerido";
		}

		// Validar apellido
		if (!formData.apellido) {
			newErrors.apellido = "El apellido es requerido";
		}

		// Validar legajo
		if (!formData.legajo) {
			newErrors.legajo = "El legajo es requerido";
		} else if (isNaN(Number(formData.legajo))) {
			newErrors.legajo = "El legajo debe ser un número";
		}

		// Validar documento
		if (!formData.documento) {
			newErrors.documento = "El documento es requerido";
		} else if (isNaN(Number(formData.documento))) {
			newErrors.documento = "El documento debe ser un número";
		}

		// Validar rol
		if (!formData.rol) {
			newErrors.rol = "El rol es requerido";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));

		// Limpiar error del campo cuando el usuario empiece a escribir
		if (errors[field]) {
			setErrors((prev) => ({
				...prev,
				[field]: "",
			}));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setLoading(true);

		try {
			const userData = {
				email: formData.email,
				nombre: formData.nombre,
				apellido: formData.apellido,
				legajo: parseInt(formData.legajo),
				documento: parseInt(formData.documento),
				rol: parseInt(formData.rol),
				is_active: formData.is_active,
			};

			await API.put(`/facet/users/${id}/`, userData);

			Swal.fire({
				icon: "success",
				title: "Usuario actualizado exitosamente",
				text: "Los cambios han sido guardados correctamente.",
				confirmButtonText: "Aceptar",
			}).then(() => {
				router.push("/dashboard/usuarios");
			});
		} catch (error: any) {
			console.error("Error al actualizar usuario:", error);

			let errorMessage = "Error al actualizar el usuario";

			if (error.response?.data) {
				if (error.response.data.email) {
					errorMessage = "El email ya está registrado en el sistema";
				} else if (error.response.data.legajo) {
					errorMessage = "El legajo ya está registrado en el sistema";
				} else if (error.response.data.documento) {
					errorMessage = "El documento ya está registrado en el sistema";
				} else if (error.response.data.rol) {
					errorMessage = "El rol seleccionado no es válido";
				} else if (typeof error.response.data === "object") {
					errorMessage = Object.values(error.response.data).join(", ");
				}
			}

			Swal.fire({
				icon: "error",
				title: "Error",
				text: errorMessage,
			});
		} finally {
			setLoading(false);
		}
	};

	if (loadingData) {
		return (
			<DashboardMenu>
				<BasicModal
					open={true}
					onClose={() => {}}
					title="Cargando usuario..."
					content="Por favor espere mientras se cargan los datos del usuario."
				/>
			</DashboardMenu>
		);
	}

	if (!usuario) {
		return (
			<DashboardMenu>
				<div className="bg-white rounded-lg shadow-lg p-6">
					<Alert severity="error">
						No se pudo cargar la información del usuario.
					</Alert>
				</div>
			</DashboardMenu>
		);
	}

	return (
		<DashboardMenu>
			<div className="bg-white rounded-lg shadow-lg">
				<div className="p-6 border-b border-gray-200">
					<Typography variant="h5" className="font-bold text-gray-800">
						Editar Usuario
					</Typography>
				</div>

				<div className="p-4">
					<form onSubmit={handleSubmit}>
						<Grid container spacing={2}>
							{/* Información de Acceso */}
							<Grid item xs={12}>
								<Typography
									variant="h6"
									className="text-gray-700 font-semibold mb-3"
								>
									Información de Acceso
								</Typography>
							</Grid>

							{/* Email */}
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label="Email"
									type="email"
									value={formData.email}
									onChange={(e) => handleInputChange("email", e.target.value)}
									error={!!errors.email}
									helperText={errors.email}
									required
									size="small"
									className="modern-input"
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: "8px",
											backgroundColor: "#ffffff",
											border: "1px solid #d1d5db",
											transition: "all 0.2s ease",
											"&:hover": {
												borderColor: "#3267d6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
											},
											"&.Mui-focused": {
												borderColor: "#3267d6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
											},
										},
										"& .MuiInputLabel-root": {
											color: "#6b7280",
											fontWeight: "500",
											backgroundColor: "#ffffff",
											padding: "0 4px",
											"&.Mui-focused": {
												color: "#3267d6",
												fontWeight: "600",
												backgroundColor: "#ffffff",
											},
										},
										"& .MuiFormLabel-filled": {
											backgroundColor: "#ffffff",
										},
										"& .MuiInputBase-input": {
											color: "#1f2937",
											fontWeight: "500",
											fontSize: "0.875rem",
											padding: "8px 12px",
										},
									}}
								/>
							</Grid>

							{/* Rol */}
							<Grid item xs={12} md={6}>
								<TextField
									select
									fullWidth
									label="Rol"
									value={formData.rol}
									onChange={(e) => handleInputChange("rol", e.target.value)}
									error={!!errors.rol}
									helperText={errors.rol}
									required
									size="small"
									className="modern-input"
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: "8px",
											backgroundColor: "#ffffff",
											border: "1px solid #d1d5db",
											transition: "all 0.2s ease",
											"&:hover": {
												borderColor: "#3267d6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
											},
											"&.Mui-focused": {
												borderColor: "#3267d6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
											},
										},
										"& .MuiInputLabel-root": {
											color: "#6b7280",
											fontWeight: "500",
											backgroundColor: "#ffffff",
											padding: "0 4px",
											"&.Mui-focused": {
												color: "#3267d6",
												fontWeight: "600",
												backgroundColor: "#ffffff",
											},
										},
										"& .MuiFormLabel-filled": {
											backgroundColor: "#ffffff",
										},
										"& .MuiInputBase-input": {
											color: "#1f2937",
											fontWeight: "500",
											fontSize: "0.875rem",
											padding: "8px 12px",
										},
										"& .MuiSelect-icon": {
											color: "#6b7280",
											transition: "color 0.2s ease",
										},
										"&:hover .MuiSelect-icon": {
											color: "#3267d6",
										},
									}}
								>
									{roles.map((rol) => (
										<MenuItem key={rol.id} value={rol.id}>
											{rol.descripcion}
										</MenuItem>
									))}
								</TextField>
							</Grid>

							{/* Separador visual */}
							<Grid item xs={12}>
								<div className="border-t border-gray-200 my-4"></div>
							</Grid>

							{/* Información Personal */}
							<Grid item xs={12}>
								<Typography
									variant="h6"
									className="text-gray-700 font-semibold mb-3"
								>
									Información Personal
								</Typography>
							</Grid>

							{/* Nombre */}
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label="Nombre"
									value={formData.nombre}
									onChange={(e) => handleInputChange("nombre", e.target.value)}
									error={!!errors.nombre}
									helperText={errors.nombre}
									required
									size="small"
									className="modern-input"
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: "8px",
											backgroundColor: "#ffffff",
											border: "1px solid #d1d5db",
											transition: "all 0.2s ease",
											"&:hover": {
												borderColor: "#3267d6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
											},
											"&.Mui-focused": {
												borderColor: "#3267d6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
											},
										},
										"& .MuiInputLabel-root": {
											color: "#6b7280",
											fontWeight: "500",
											backgroundColor: "#ffffff",
											padding: "0 4px",
											"&.Mui-focused": {
												color: "#3267d6",
												fontWeight: "600",
												backgroundColor: "#ffffff",
											},
										},
										"& .MuiFormLabel-filled": {
											backgroundColor: "#ffffff",
										},
										"& .MuiInputBase-input": {
											color: "#1f2937",
											fontWeight: "500",
											fontSize: "0.875rem",
											padding: "8px 12px",
										},
									}}
								/>
							</Grid>

							{/* Apellido */}
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label="Apellido"
									value={formData.apellido}
									onChange={(e) =>
										handleInputChange("apellido", e.target.value)
									}
									error={!!errors.apellido}
									helperText={errors.apellido}
									required
									size="small"
									className="modern-input"
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: "8px",
											backgroundColor: "#ffffff",
											border: "1px solid #d1d5db",
											transition: "all 0.2s ease",
											"&:hover": {
												borderColor: "#3267d6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
											},
											"&.Mui-focused": {
												borderColor: "#3267d6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
											},
										},
										"& .MuiInputLabel-root": {
											color: "#6b7280",
											fontWeight: "500",
											backgroundColor: "#ffffff",
											padding: "0 4px",
											"&.Mui-focused": {
												color: "#3267d6",
												fontWeight: "600",
												backgroundColor: "#ffffff",
											},
										},
										"& .MuiFormLabel-filled": {
											backgroundColor: "#ffffff",
										},
										"& .MuiInputBase-input": {
											color: "#1f2937",
											fontWeight: "500",
											fontSize: "0.875rem",
											padding: "8px 12px",
										},
									}}
								/>
							</Grid>

							{/* Separador visual */}
							<Grid item xs={12}>
								<div className="border-t border-gray-200 my-4"></div>
							</Grid>

							{/* Información Institucional */}
							<Grid item xs={12}>
								<Typography
									variant="h6"
									className="text-gray-700 font-semibold mb-3"
								>
									Información Institucional
								</Typography>
							</Grid>

							{/* Legajo */}
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label="Legajo"
									type="number"
									value={formData.legajo}
									onChange={(e) => handleInputChange("legajo", e.target.value)}
									error={!!errors.legajo}
									helperText={errors.legajo}
									required
									size="small"
									className="modern-input"
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: "8px",
											backgroundColor: "#ffffff",
											border: "1px solid #d1d5db",
											transition: "all 0.2s ease",
											"&:hover": {
												borderColor: "#3267d6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
											},
											"&.Mui-focused": {
												borderColor: "#3267d6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
											},
										},
										"& .MuiInputLabel-root": {
											color: "#6b7280",
											fontWeight: "500",
											backgroundColor: "#ffffff",
											padding: "0 4px",
											"&.Mui-focused": {
												color: "#3267d6",
												fontWeight: "600",
												backgroundColor: "#ffffff",
											},
										},
										"& .MuiFormLabel-filled": {
											backgroundColor: "#ffffff",
										},
										"& .MuiInputBase-input": {
											color: "#1f2937",
											fontWeight: "500",
											fontSize: "0.875rem",
											padding: "8px 12px",
										},
									}}
								/>
							</Grid>

							{/* Documento */}
							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label="Documento"
									type="number"
									value={formData.documento}
									onChange={(e) =>
										handleInputChange("documento", e.target.value)
									}
									error={!!errors.documento}
									helperText={errors.documento}
									required
									size="small"
									className="modern-input"
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: "8px",
											backgroundColor: "#ffffff",
											border: "1px solid #d1d5db",
											transition: "all 0.2s ease",
											"&:hover": {
												borderColor: "#3267d6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
											},
											"&.Mui-focused": {
												borderColor: "#3267d6",
												backgroundColor: "#ffffff",
												boxShadow: "0 0 3px rgba(59, 130, 246, 0.1)",
											},
										},
										"& .MuiInputLabel-root": {
											color: "#6b7280",
											fontWeight: "500",
											backgroundColor: "#ffffff",
											padding: "0 4px",
											"&.Mui-focused": {
												color: "#3267d6",
												fontWeight: "600",
												backgroundColor: "#ffffff",
											},
										},
										"& .MuiFormLabel-filled": {
											backgroundColor: "#ffffff",
										},
										"& .MuiInputBase-input": {
											color: "#1f2937",
											fontWeight: "500",
											fontSize: "0.875rem",
											padding: "8px 12px",
										},
									}}
								/>
							</Grid>

							{/* Separador visual */}
							<Grid item xs={12}>
								<div className="border-t border-gray-200 my-4"></div>
							</Grid>

							{/* Estado del Usuario */}
							<Grid item xs={12}>
								<Typography
									variant="h6"
									className="text-gray-700 font-semibold mb-3"
								>
									Estado del Usuario
								</Typography>
							</Grid>

							{/* Estado */}
							<Grid item xs={12}>
								<FormControlLabel
									control={
										<Switch
											checked={formData.is_active}
											onChange={(e) =>
												handleInputChange("is_active", e.target.checked)
											}
											color="primary"
										/>
									}
									label="Usuario Activo"
								/>
								<Typography
									variant="caption"
									display="block"
									color="textSecondary"
								>
									Desactivar un usuario lo excluye del sistema pero mantiene sus
									datos
								</Typography>
							</Grid>

							{/* Información adicional */}
							<Grid item xs={12}>
								<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
									<Typography
										variant="body2"
										className="text-sm font-medium text-gray-800"
									>
										<span className="font-bold text-blue-700">Rol actual:</span>{" "}
										{usuario.rol_detalle}
									</Typography>
								</div>
							</Grid>
						</Grid>

						<div className="flex justify-center mt-6">
							<Button
								type="submit"
								variant="contained"
								disabled={loading}
								startIcon={
									loading ? <CircularProgress size={20} /> : <SaveIcon />
								}
								className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 font-medium"
							>
								{loading ? "Guardando..." : "Guardar Cambios"}
							</Button>
						</div>
					</form>
				</div>
			</div>
		</DashboardMenu>
	);
};

export default withAuth(EditarUsuario);
