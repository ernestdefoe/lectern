import app from 'flarum/admin/app';

app.initializers.add('ernestdefoe-lectern', () => {
  const t = (key) => app.translator.trans('ernestdefoe-lectern.admin.' + key);

  app.registry
    .for('ernestdefoe-lectern')
    .registerSetting({
      setting: 'ernestdefoe-lectern.enabled',
      type: 'boolean',
      label: t('enabled_label'),
      help: t('enabled_help'),
      default: true,
    })
    .registerSetting({
      setting: 'ernestdefoe-lectern.mode',
      type: 'select',
      label: t('mode_label'),
      help: t('mode_help'),
      options: { modal: t('mode.modal'), inline: t('mode.inline') },
      default: 'modal',
    })
    .registerSetting(() => <p className="helpText">{t('fof_upload_help')}</p>)
    .registerPermission(
      {
        icon: 'fas fa-book-open-reader',
        label: t('permission'),
        permission: 'ernestdefoe-lectern.view',
        allowGuest: true,
      },
      'view'
    );
});
