import { useEffect, useState } from 'react';
import './styles.css';
import axios from 'axios';
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  TextField,
  Button,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Grid,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs'; // Asegúrate de tener instalada esta dependencia
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Tooltip from '@mui/material/Tooltip';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router'; // Importa useRouter de Next.js

// Habilita los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const ListaResoluciones = () => {
  interface Resolucion {
    id: number;
    nexpediente: string;
    nresolucion: string;
    tipo: string;
    fecha_creacion: Date;
    fecha: Date; // Aquí indicas que 'fecha' es de tipo Date
    adjunto: string;
    observaciones: string;
    estado: 0 | 1; // Aquí indicas que 'estado' es un enum que puede ser 0 o 1
    // Otros campos según sea necesario
  }

  const [resoluciones, setResoluciones] = useState<Resolucion[]>([]);
  const [filtroNroExpediente, setFiltroNroExpediente] = useState('');
  const [filtroNroResolucion, setFiltroNroResolucion] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroFecha, setFiltroFecha] = useState<dayjs.Dayjs | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string | number>(''); // Agregado
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('http://127.0.0.1:8000/facet/resolucion/');
  const [totalItems, setTotalItems] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const router = useRouter(); // Usamos useRouter para manejar la navegación

  useEffect(() => {
    fetchData(currentUrl);
  }, [currentUrl]);

  const fetchData = async (url: string) => {
    try {
      const response = await axios.get(url);
      setResoluciones(response.data.results);
      setNextUrl(response.data.next);
      setPrevUrl(response.data.previous);
      setTotalItems(response.data.count);
      setCurrentPage(1);
    } catch (error) {
      // Muestra un mensaje de error con SweetAlert2
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al obtener los datos.',
      });
    }
  };

  const filtrarResoluciones = () => {
    let url = `http://127.0.0.1:8000/facet/resolucion/?`;
    const params = new URLSearchParams();

    if (filtroNroExpediente !== '') {
      params.append('nexpediente__icontains', filtroNroExpediente);
    }
    if (filtroEstado !== '') {
      params.append('estado', filtroEstado.toString());
    }
    if (filtroTipo !== '') {
      params.append('tipo', filtroTipo);
    }
    if (filtroNroResolucion !== '') {
      params.append('nresolucion__icontains', filtroNroResolucion);
    }
    if (filtroFecha) {
      const fechaStr = filtroFecha.format('YYYY-MM-DD');
      if (fechaStr !== 'Invalid Date') {
        params.append('fecha__date', fechaStr);
      }
    }

    url += params.toString();
    setCurrentUrl(url);
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  const descargarExcel = async () => {
    try {
      let allResoluciones: Resolucion[] = [];

      let url = `http://127.0.0.1:8000/facet/resolucion/?`;
      const params = new URLSearchParams();
      if (filtroNroExpediente !== '') {
        params.append('nexpediente__icontains', filtroNroExpediente);
      }
      if (filtroEstado !== '') {
        params.append('estado', filtroEstado.toString());
      }
      if (filtroTipo !== '') {
        params.append('tipo', filtroTipo);
      }
      if (filtroNroResolucion !== '') {
        params.append('nresolucion__icontains', filtroNroResolucion);
      }
      if (filtroFecha) {
        params.append('fecha__date', filtroFecha.format('YYYY-MM-DD')); // Formato ISO8601 para la fecha exacta
      }
      url += params.toString();

      while (url) {
        const response = await axios.get(url);
        const { results, next } = response.data;

        allResoluciones = [...allResoluciones, ...results];
        url = next;
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(allResoluciones);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Resoluciones');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(excelBlob, 'resoluciones.xlsx');
    } catch (error) {
      // Muestra un mensaje de error con SweetAlert2
      Swal.fire({
        icon: 'error',
        title: 'Error al descargar',
        text: 'Se produjo un error al exportar los datos.',
      });
    }
  };

  return (
    <Container maxWidth="lg">
      <div>
        <Button variant="contained" onClick={() => router.push('/dashboard/resoluciones/crear')} endIcon={<AddIcon />}>
          Agregar Resolución
        </Button>
        <Button variant="contained" color="primary" onClick={descargarExcel} style={{ marginLeft: '10px' }}>
          Descargar Excel
        </Button>
      </div>

      <Paper elevation={3} style={{ padding: '20px', marginTop: '20px' }}>
        <Typography variant="h4" gutterBottom>
          Resoluciones
        </Typography>

        {/* Agrega controles de entrada y botones para los filtros */}
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <TextField
              label="Nro Expediente"
              value={filtroNroExpediente}
              onChange={(e) => setFiltroNroExpediente(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Nro Resolución"
              value={filtroNroResolucion}
              onChange={(e) => setFiltroNroResolucion(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth margin="none">
              <InputLabel id="demo-simple-select-label">Tipo</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={filtroTipo}
                label="Tipo"
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <MenuItem value={""}>Todos</MenuItem>
                <MenuItem value={"Rector"}>Rector</MenuItem>
                <MenuItem value={"Decano"}>Decano</MenuItem>
                <MenuItem value={"Consejo_Superior"}>Consejo Superior</MenuItem>
                <MenuItem value={"Consejo_Directivo"}>Consejo Directivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4} marginBottom={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Fecha"
                value={filtroFecha}
                onChange={(date) => {
                  if (date) {
                    const fechaSeleccionada = dayjs(date).utc(); // Usa .utc() para evitar problemas de zona horaria
                    setFiltroFecha(fechaSeleccionada);
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={4} marginBottom={2}>
            <Button variant="contained" onClick={filtrarResoluciones}>
              Filtrar
            </Button>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow className='header-row'>
                <TableCell className='header-cell'>
                  <Typography variant="subtitle1">Nro Expediente</Typography>
                </TableCell>
                <TableCell className='header-cell'>
                  <Typography variant="subtitle1">Nro Resolución</Typography>
                </TableCell>
                <TableCell className='header-cell'>
                  <Typography variant="subtitle1">Tipo</Typography>
                </TableCell>
                <TableCell className='header-cell'>
                  <Typography variant="subtitle1">Fecha</Typography>
                </TableCell>
                <TableCell className='header-cell'>
                  <Typography variant="subtitle1">Carga</Typography>
                </TableCell>
                <TableCell className='header-cell'>
                  <Typography variant="subtitle1">Estado</Typography>
                </TableCell>
                <TableCell className='header-cell'>
                  <Typography variant="subtitle1">Adjunto</Typography>
                </TableCell>
                <TableCell className='header-cell'>
                  <Typography variant="subtitle1">Observaciones</Typography>
                </TableCell>
                <TableCell className='header-cell'>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resoluciones.map((resolucion) => (
                <TableRow key={resolucion.id}>
                  <TableCell>
                    <Typography variant="body1">{resolucion.nexpediente}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">{resolucion.nresolucion}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {resolucion.tipo === 'Consejo_Superior' ? 'Consejo Superior' :
                        (resolucion.tipo === 'Consejo_Directivo' ? 'Consejo Directivo' : resolucion.tipo)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {resolucion.fecha ? dayjs(resolucion.fecha).format('DD/MM/YYYY') : 'No disponible'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">
                      {resolucion.fecha_creacion ? dayjs(resolucion.fecha_creacion).format('DD/MM/YYYY') : 'No disponible'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">{resolucion.estado}</Typography>
                  </TableCell>
                  <TableCell style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <a href={resolucion.adjunto} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', lineHeight: '0' }}>
                      <TextSnippetIcon />
                    </a>
                  </TableCell>
                  <TableCell style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <Tooltip title={resolucion.observaciones}>
                      <VisibilityIcon />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => router.push(`/dashboard/resoluciones/editar/${resolucion.id}`)}>
                      <EditIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              prevUrl && setCurrentUrl(prevUrl);
              setCurrentPage(currentPage - 1);
            }}
            disabled={!prevUrl}
          >
            Anterior
          </Button>
          <Typography variant="body1">
            Página {currentPage} de {totalPages}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              nextUrl && setCurrentUrl(nextUrl);
              setCurrentPage(currentPage + 1);
            }}
            disabled={!nextUrl}
          >
            Siguiente
          </Button>
        </div>
      </Paper>
    </Container>
  );
};

export default ListaResoluciones;
