import { useEffect, useState } from 'react';
import type { FormEvent } from 'react'; 
import axios from 'axios';
import './App.css';

// --- DEFINIÇÕES DE TIPOS (Compatíveis com verbatimModuleSyntax) ---
const TransactionType = { Receita: 1, Despesa: 2 } as const;
type TransactionType = typeof TransactionType[keyof typeof TransactionType];

const CategoryFinality = { Receita: 1, Despesa: 2, Ambas: 3 } as const;
type CategoryFinality = typeof CategoryFinality[keyof typeof CategoryFinality];

// --- INTERFACES ---
interface Person { id?: number; name: string; age: number; }
interface Category { id?: number; description: string; finality: CategoryFinality; } 
interface Transaction {
  id?: number;
  description: string;
  amount: number;
  type: TransactionType;
  personId: number;
  categoryId: number;
  person?: Person;
  category?: Category;
}
interface GeneralReport {
  pessoas: { name: string; totalReceitas: number; totalDespesas: number; saldo: number; }[];
  totalGeralReceitas: number;
  totalGeralDespesas: number;
  saldoLiquidoGeral: number;
}

function App() {
  const API_URL = 'https://localhost:7260/api';

  // States para Listas
  const [persons, setPersons] = useState<Person[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [report, setReport] = useState<GeneralReport | null>(null);

  // States para Formulários
  const [pName, setPName] = useState('');
  const [pAge, setPAge] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cFinality, setCFinality] = useState<CategoryFinality>(CategoryFinality.Ambas);
  const [tDesc, setTDesc] = useState('');
  const [tAmount, setTAmount] = useState('');
  const [tType, setTType] = useState<TransactionType>(TransactionType.Despesa);
  const [tPersonId, setTPersonId] = useState('');
  const [tCategoryId, setTCategoryId] = useState('');

  // --- BUSCA DE DADOS ---
  const fetchData = async () => {
    try {
      const [p, c, t, r] = await Promise.all([
        axios.get(`${API_URL}/Persons`),
        axios.get(`${API_URL}/Categories`),
        axios.get(`${API_URL}/Transactions`),
        axios.get(`${API_URL}/Reports/totals-by-person`)
      ]);
      setPersons(p.data);
      setCategories(c.data);
      setTransactions(t.data);
      setReport(r.data);
    } catch (err) {
      console.error("Erro ao buscar dados da API", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };
    loadData();
  }, []);

  // --- ACTIONS ---
  const addPerson = (e: FormEvent) => {
    e.preventDefault();
    axios.post(`${API_URL}/Persons`, { name: pName, age: Number(pAge) })
      .then(() => { setPName(''); setPAge(''); fetchData(); });
  };

  const deletePerson = (id: number) => {
    if(window.confirm("Ao excluir a pessoa, todos os gastos dela sumirão. Confirmar?")) {
      axios.delete(`${API_URL}/Persons/${id}`).then(() => fetchData());
    }
  };

  const addCategory = (e: FormEvent) => {
    e.preventDefault();
    axios.post(`${API_URL}/Categories`, { description: cDesc, finality: Number(cFinality) })
      .then(() => { setCDesc(''); fetchData(); });
  };

  const addTransaction = (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      description: tDesc,
      amount: Number(tAmount),
      type: Number(tType),
      personId: Number(tPersonId),
      categoryId: Number(tCategoryId)
    };

    axios.post(`${API_URL}/Transactions`, payload)
      .then(() => {
        setTDesc(''); setTAmount(''); setTPersonId(''); setTCategoryId('');
        fetchData();
      })
      .catch(err => alert(err.response?.data || "Erro ao salvar: Verifique se selecionou Pessoa e Categoria"));
  };

  // --- ESTILOS ---
  const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#1e1e1e', color: '#fff', marginBottom: '10px', boxSizing: 'border-box' as const };
  const btnStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#3a3a3a', color: '#fff', cursor: 'pointer', fontWeight: 'bold' as const };
  const cardStyle = { backgroundColor: '#252525', padding: '20px', borderRadius: '8px', border: '1px solid #333', marginBottom: '20px' };

  return (
    <div style={{ color: '#e0e0e0', backgroundColor: '#121212', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      
      <h1 style={{ textAlign: 'center', color: '#fff' }}>Controle de Gastos Residencial</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={cardStyle}>
          <h3>Nova Pessoa</h3>
          <form onSubmit={addPerson}>
            <input placeholder="Nome" value={pName} onChange={e => setPName(e.target.value)} required style={inputStyle} />
            <input type="number" placeholder="Idade" value={pAge} onChange={e => setPAge(e.target.value)} required style={inputStyle} />
            <button type="submit" style={btnStyle}>Cadastrar</button>
          </form>
        </div>

        <div style={cardStyle}>
          <h3>Nova Categoria</h3>
          <form onSubmit={addCategory}>
            <input placeholder="Descrição" value={cDesc} onChange={e => setCDesc(e.target.value)} required style={inputStyle} />
            <select value={cFinality} onChange={e => setCFinality(Number(e.target.value) as CategoryFinality)} style={inputStyle}>
              <option value={CategoryFinality.Receita}>Só Receita</option>
              <option value={CategoryFinality.Despesa}>Só Despesa</option>
              <option value={CategoryFinality.Ambas}>Ambas (Receita e Despesa)</option>
            </select>
            <button type="submit" style={btnStyle}>Cadastrar</button>
          </form>
        </div>
      </div>

      <div style={cardStyle}>
        <h3>Registrar Movimentação</h3>
        <form onSubmit={addTransaction} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input placeholder="Descrição" value={tDesc} onChange={e => setTDesc(e.target.value)} required style={inputStyle} />
          <input type="number" step="0.01" placeholder="Valor R$" value={tAmount} onChange={e => setTAmount(e.target.value)} required style={inputStyle} />
          
          <select value={tType} onChange={e => setTType(Number(e.target.value) as TransactionType)} style={inputStyle}>
            <option value={TransactionType.Receita}>Receita (+)</option>
            <option value={TransactionType.Despesa}>Despesa (-)</option>
          </select>

          <select value={tPersonId} onChange={e => setTPersonId(e.target.value)} required style={inputStyle}>
            <option value="">Quem?</option>
            {persons.map(p => <option key={p.id} value={p.id}>{p.name} ({p.age} anos)</option>)}
          </select>

          <select value={tCategoryId} onChange={e => setTCategoryId(e.target.value)} required style={{...inputStyle, gridColumn: 'span 2'}}>
            <option value="">Selecione a Categoria</option>
            {categories
              .filter(c => {
                const type = Number(tType);
                const finality = Number(c.finality);
                return type === 1 
                  ? (finality === 1 || finality === 3)
                  : (finality === 2 || finality === 3);
              })
              .map(c => <option key={c.id} value={c.id}>{c.description}</option>)}
          </select>
          <button type="submit" style={{...btnStyle, gridColumn: 'span 2', backgroundColor: '#4CAF50'}}>Confirmar Lançamento</button>
        </form>
      </div>

      {report && (
        <div style={{...cardStyle, borderColor: '#4CAF50'}}>
          <h3 style={{ color: '#4CAF50' }}>Resumo de Saldos por Pessoa</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444' }}>
                <th>Nome</th>
                <th>Receitas</th>
                <th>Despesas</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {report.pessoas.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '10px 0' }}>{p.name}</td>
                  <td style={{ color: '#4CAF50' }}>R$ {p.totalReceitas.toFixed(2)}</td>
                  <td style={{ color: '#FF5252' }}>R$ {p.totalDespesas.toFixed(2)}</td>
                  <td style={{ fontWeight: 'bold' }}>R$ {p.saldo.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '5px' }}>
            <p>Total Receitas: <span style={{ color: '#4CAF50' }}>R$ {report.totalGeralReceitas.toFixed(2)}</span></p>
            <p>Total Despesas: <span style={{ color: '#FF5252' }}>R$ {report.totalGeralDespesas.toFixed(2)}</span></p>
            <hr style={{ borderColor: '#333' }} />
            <h4>Saldo Líquido Geral: R$ {report.saldoLiquidoGeral.toFixed(2)}</h4>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h4>Pessoas Cadastradas</h4>
          {persons.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#252525', marginBottom: '5px', borderRadius: '4px' }}>
              <span>{p.name}</span>
              <button onClick={() => deletePerson(p.id!)} style={{ color: '#FF5252', background: 'none', border: 'none', cursor: 'pointer' }}>Excluir</button>
            </div>
          ))}
        </div>
        
        <div>
          <h4>Histórico Recente</h4>
          {transactions.slice(-5).reverse().map(t => (
            <div key={t.id} style={{ padding: '10px', backgroundColor: '#252525', marginBottom: '5px', borderRadius: '4px', fontSize: '0.8rem' }}>
              <strong>{t.description}</strong> - {t.type === 1 ? 'Receita' : 'Despesa'} <br/>
              <span style={{ color: '#888' }}>{t.person?.name} | R$ {t.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;