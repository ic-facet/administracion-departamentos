import { useEffect, useState } from "react";
import "./styles.css";
import API from "@/api/axiosConfig";
import {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import ResponsiveTable from "../../../../../components/ResponsiveTable";
import ActionMenu from "../../../../../components/ActionMenu";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { exportToExcel } from "@/utils/exportToExcel";
import Swal from "sweetalert2";
import { useRouter } from "next/router";
import DashboardMenu from "../../..";
import withAuth from "../../../../../components/withAut";
import {
  FilterContainer,
  FilterInput,
  EstadoFilter,
} from "../../../../../components/Filters";
import Pagination from "../../../../../components/Pagination";
import DetailModal, { StatusBadge } from "../../../../../components/DetailModal";
import LoadingOverlay from "../../../../../components/LoadingOverlay";
import { normalizeUrl } from "@/utils/urlHelpers";

const ListaDocentes = () => {
  interface Docente {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
    legajo: string;
    telefono: string;
    email: string;
    estado: string;
  }

  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroApellido, setFiltroApellido] = useState("");
  const [filtroDni, setFiltroDni] = useState("");
  const [filtroLegajo, setFiltroLegajo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("1");
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(
    `/facet/persona/?docente=true&estado=1`
  );
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewDocente, setViewDocente] = useState<Docente | null>(null);
  const [modalViewVisible, setModalViewVisible] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      setIsLoading(true);
      const response = await API.get(url);
      setDocentes(response.data.results);
      setNextUrl(response.data.next ? normalizeUrl(response.data.next) : null);
      setPrevUrl(
        response.data.previous ? normalizeUrl(response.data.previous) : null
      );
      setTotalItems(response.data.count);
      // Pequeño delay para asegurar que los estilos se cargan
      setTimeout(() => setIsLoading(false), 500);
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al obtener los datos.",
      });
    }
  };

  const filtrarDocentes = () => {
    let url = `/facet/persona/?docente=true&`;
    const params = new URLSearchParams();
    if (filtroNombre !== "") {
      params.append("nombre__icontains", filtroNombre);
    }
    if (filtroDni !== "") {
      params.append("dni__icontains", filtroDni);
    }
    if (filtroEstado === "todos") {
      params.append("show_all", "true");
    } else if (filtroEstado !== "" && filtroEstado !== "todos") {
      params.append("estado", filtroEstado.toString());
    }
    if (filtroApellido !== "") {
      params.append("apellido__icontains", filtroApellido);
    }
    if (filtroLegajo !== "") {
      params.append("legajo__icontains", filtroLegajo);
    }
    url += params.toString();
    setCurrentPage(1);
    setCurrentUrl(url);
  };

  const limpiarFiltros = () => {
    setFiltroNombre("");
    setFiltroApellido("");
    setFiltroDni("");
    setFiltroLegajo("");
    setFiltroEstado("1");
    setCurrentPage(1);
    setCurrentUrl(`/facet/persona/?docente=true&estado=1`);
  };

  const descargarExcel = async () => {
    try {
      let allDocentes: Docente[] = [];
      let url = `/facet/persona/?docente=true&`;
      const params = new URLSearchParams();

      if (filtroNombre !== "")
        params.append("nombre__icontains", filtroNombre);
      if (filtroApellido !== "")
        params.append("apellido__icontains", filtroApellido);
      if (filtroDni !== "") params.append("dni__icontains", filtroDni);
      if (filtroLegajo !== "")
        params.append("legajo__icontains", filtroLegajo);
      if (filtroEstado === "todos") {
        params.append("show_all", "true");
      } else if (filtroEstado !== "" && filtroEstado !== "todos") {
        params.append("estado", filtroEstado.toString());
      }
      url += params.toString();

      while (url) {
        const response = await API.get(url);
        const { results, next } = response.data;
        allDocentes = [...allDocentes, ...results];
        url = next ? normalizeUrl(next) : "";
      }

      await exportToExcel({
        fileName: "docentes.xlsx",
        sheetName: "Docentes",
        rows: allDocentes.map((docente) => ({
          Nombre: docente.nombre || "N/A",
          Apellido: docente.apellido || "N/A",
          DNI: docente.dni || "N/A",
          Legajo: docente.legajo || "N/A",
          Teléfono: docente.telefono || "N/A",
          Email: docente.email || "N/A",
          Estado: docente.estado === "1" ? "Activo" : "Inactivo",
        })),
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al descargar",
        text: "Se produjo un error al exportar los datos.",
      });
    }
  };

  const verDocente = async (id: number) => {
    try {
      const response = await API.get(`/facet/persona/${id}/`);
      setViewDocente(response.data);
      setModalViewVisible(true);
    } catch (error) {
      Swal.fire(
        "Error!",
        "No se pudo obtener los datos del docente.",
        "error"
      );
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <DashboardMenu>
      <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Docentes</h1>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => router.push("/dashboard/persons/create")}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-semibold text-sm">
              <AddIcon /> Agregar Persona
            </button>
            <button
              onClick={descargarExcel}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-xl shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-200 font-semibold text-sm">
              <FileDownloadIcon /> Descargar Excel
            </button>
          </div>

          <FilterContainer onApply={filtrarDocentes} onClear={limpiarFiltros}>
            <FilterInput
              label="Nombre"
              value={filtroNombre}
              onChange={setFiltroNombre}
              placeholder="Buscar por nombre"
            />
            <FilterInput
              label="Apellido"
              value={filtroApellido}
              onChange={setFiltroApellido}
              placeholder="Buscar por apellido"
            />
            <FilterInput
              label="DNI"
              value={filtroDni}
              onChange={setFiltroDni}
              placeholder="Buscar por DNI"
            />
            <FilterInput
              label="Legajo"
              value={filtroLegajo}
              onChange={setFiltroLegajo}
              placeholder="Buscar por legajo"
            />
            <EstadoFilter value={filtroEstado} onChange={setFiltroEstado} />
          </FilterContainer>

          <div className="relative">

            {isLoading && <LoadingOverlay variant="overlay" message="Cargando..." />}

            <ResponsiveTable dense>
            <TableHead>
              <TableRow>
                <TableCell>
                  Nombre
                </TableCell>
                <TableCell>
                  Apellido
                </TableCell>
                <TableCell>
                  DNI
                </TableCell>
                <TableCell>
                  Legajo
                </TableCell>
                <TableCell>
                  Teléfono
                </TableCell>
                <TableCell>
                  Email
                </TableCell>
                <TableCell>
                  Estado
                </TableCell>
                <TableCell>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
              <TableBody>
                {docentes.map((docente) => (
                  <TableRow key={docente.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-800">
                      {docente.nombre || "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {docente.apellido || "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {docente.dni || "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {docente.legajo || "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {docente.telefono || "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {docente.email || "N/A"}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      <StatusBadge estado={String(docente.estado)} />
                    </TableCell>
                    <TableCell>
                      <ActionMenu
                        items={[
                          {
                            items: [
                              {
                                label: "Ver detalles",
                                icon: <VisibilityIcon fontSize="small" />,
                                onClick: () => verDocente(docente.id),
                              },
                              {
                                label: "Editar",
                                icon: <EditIcon fontSize="small" />,
                                onClick: () =>
                                  router.push(
                                    `/dashboard/persons/edit/${docente.id}`
                                  ),
                              },
                            ],
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
          </ResponsiveTable>
            </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevious={() => {
              prevUrl && setCurrentUrl(prevUrl);
              setCurrentPage(currentPage - 1);
            }}
            onNext={() => {
              nextUrl && setCurrentUrl(nextUrl);
              setCurrentPage(currentPage + 1);
            }}
            hasPrevious={!!prevUrl}
            hasNext={!!nextUrl}
          />
        </div>
      </div>
      </div>

      {/* Modal de vista de docente */}
      {viewDocente && (
        <DetailModal
          open={modalViewVisible}
          onClose={() => setModalViewVisible(false)}
          onEdit={() => {
            setModalViewVisible(false);
            router.push(`/dashboard/persons/edit/${viewDocente.id}`);
          }}
          title="Detalles del Docente"
          sections={[
            {
              title: "Información personal",
              fields: [
                { label: "DNI", value: viewDocente.dni },
                { label: "Legajo", value: viewDocente.legajo },
                { label: "Nombres", value: viewDocente.nombre },
                { label: "Apellido", value: viewDocente.apellido },
              ],
            },
            {
              title: "Información de contacto",
              fields: [
                { label: "Teléfono", value: viewDocente.telefono },
                { label: "Email", value: viewDocente.email },
                { label: "Estado", value: <StatusBadge estado={viewDocente.estado} /> },
              ],
            },
          ]}
        />
      )}
    </DashboardMenu>
  );
};

export default withAuth(ListaDocentes);


