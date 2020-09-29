import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ValidTipoTextService } from '../servicios/validaciones/validTipoText/valid-tipo-text.service';
import { ListprospectosService } from '../servicios/http-service/listprospectos/listprospectos.service';
import { DetalleprospectoService } from '../servicios/http-service/detalleprospectos/detalleprospecto.service';
import { MessagesService } from '../servicios/messages/messages.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-detalleprospecto',
  templateUrl: './detalleprospecto.component.html',
  styleUrls: ['./detalleprospecto.component.css']
})
export class DetalleprospectoComponent implements OnInit {
  faTrash = faTrash;
  faPlus = faPlus;
  formulario: FormGroup;
  titulo = "Nuevo Prospecto";
  submitted: boolean = false
  estatusG: any = [];
  estatusEdit = 1;
  detallesP: any = [];
  editando: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    public validText: ValidTipoTextService,
    private route: ActivatedRoute,
    public estadosHTTP: ListprospectosService,
    public DetalleService: DetalleprospectoService,
    public MessagesService: MessagesService,
    public router: Router
  ) {  }

  ngOnInit(): void {
    this.route
    .queryParams
    .subscribe(params => {
      
      if(params.detalles){
        this.detallesP = params.detalles
        this.detallesP = JSON.parse(this.detallesP)
        this.editando = true;
        this.initFormEdit(this.detallesP.prospecto)
      }else{
        this.initFormNew()
      }

      this.getEstatus()
    });
  }

  initFormNew(){
    this.estatusEdit = 1

    this.formulario = this.formBuilder.group({
      nombre: [null,[Validators.required]],
      pApellido: [null,[Validators.required]],
      sApellido: [null],
      calle: [null,Validators.required],
      numero: [null,Validators.required],
      colonia:  [null,Validators.required],
      cp:  [null,Validators.required],
      telefono: [null,Validators.required],
      rfc: [null,[Validators.required]],
      estatus: [this.estatusEdit,[Validators.required]],
      observaciones: [''],
      documentos: this.formBuilder.array([this.addItemsToFormDoc()])
    });

    this.formulario.get('estatus').disable()
  }

  initFormEdit(params){
    var estats = ''
    this.estatusEdit = params.idestatus

    if(params.idestatus != 1){
      estats = params.idestatus
    }
    
    this.formulario = this.formBuilder.group({
      nombre: [params.nombre,[Validators.required]],
      pApellido: [params.pApellido,[Validators.required]],
      sApellido: [params.sApellido],
      calle: [params.calle,Validators.required],
      numero: [params.numero,Validators.required],
      colonia:  [params.colonia,Validators.required],
      cp:  [params.cp,Validators.required],
      telefono: [params.telefono,Validators.required],
      rfc: [params.rfc,[Validators.required]],
      estatus: [estats,[Validators.required]],
      observaciones: [params.observaciones],
      documentos: this.formBuilder.array([this.addItemsToFormDoc()])
    });

    this.disableInputs()
  }

  disableInputs(){
    this.formulario.get('nombre').disable()
    this.formulario.get('pApellido').disable()
    this.formulario.get('sApellido').disable()
    this.formulario.get('calle').disable()
    this.formulario.get('numero').disable()
    this.formulario.get('colonia').disable()
    this.formulario.get('cp').disable()
    this.formulario.get('telefono').disable()
    this.formulario.get('rfc').disable()

    if(this.estatusEdit != 1){
      this.formulario.get('estatus').disable()
    }

    if(this.estatusEdit == 3){
      this.formulario.get('observaciones').disable()
    }
  }

  
  getEstatus(){
    this.estadosHTTP.getEstatus().then(data => {
      var res: any = data
      res = JSON.parse(res._body)
      
      if(res.codigo == 200){
        if(this.editando){
          
          for(let estatus of res.resultado){
            if(estatus.id != 1){
              this.estatusG.push(estatus);
            }
          }
        }else{
          this.estatusG = res.resultado;
        }
      }
    });
  }

  addItemDoc(){
    var items = this.formulario.get('documentos') as FormArray;
    items.push(this.addItemsToFormDoc());
  }

  addItemsToFormDoc(): FormGroup {
    return  this.formBuilder.group({
      nombredoc: [null,Validators.required],
      base64: [null,Validators.required],
      formato: [null,Validators.required]
    });
  }

  deleteItemDoc(id){
    if(this.formulario.get('documentos')['controls'].length > 1){
      this.formulario.get('documentos')['controls'].splice(id,1);
      this.formulario.get('documentos').updateValueAndValidity();
    }else{
      this.MessagesService.showSuccessDialog('Los documentos son obligatorios','error')
    }
  }

  get validaF() { return this.formulario.controls; }
  get validaFDocs() { return this.formulario.controls.documentos['controls']; }

  handleUpload(event,index) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      var base64: any = reader.result;
      var format = file.type.split('/')
      
      this.formulario.get('documentos')['controls'][index].controls.base64.setValue(base64.split(';base64,').pop())
      this.formulario.get('documentos')['controls'][index].controls.formato.setValue(format[1])
    };
  }

  guardar(val) {
    this.submitted = true;

    if ((this.formulario.valid && this.estatusEdit == 1) || (val.estatus == 2) || (val.estatus == 3 && val.observaciones != '')) {
      if(!val.estatus){
        val.estatus = this.estatusEdit
      }
      
      if(val.estatus != 1){
        val.id = this.detallesP.prospecto.id
      }

      this.MessagesService.showLoading()
      this.startSend(val)
    }else {
      this.MessagesService.showSuccessDialog('Los campos marcados con un * son requeridos','error')
    }
  }

  startSend(val){
    this.DetalleService.setProspecto(val).then(data => {
      this.MessagesService.closeLoading()
      var res: any = data
      res = JSON.parse(res._body)

      if(res.codigo == 200 ){
        this.MessagesService.showSuccessDialog(res.mensaje)
        this.router.navigate(['/listprospectos'])
      }else{
        this.MessagesService.showSuccessDialog(res.mensaje,'error')
      }
    });
  }

  salir(){
    if(this.estatusEdit == 1){
      var route = this.router
      this.MessagesService.showConfirmDialog("Si acepta no se guardaran los cambios realizados",'warning').then(function (data){
        if(data.isConfirmed){
          route.navigate(['/listprospectos'])
        }
      })  
    }else{
      this.router.navigate(['/listprospectos'])
    }
  }
}
